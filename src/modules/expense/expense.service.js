const expenseRepo = require('./expense.repository');
const currencyService = require('../currency/currency.service');
const approvalService = require('../approval/approval.service');
const AppError = require('../../utils/AppError');

const COMPANY_CURRENCY = process.env.DEFAULT_COMPANY_CURRENCY || 'USD';

const createExpense = async (dto, user) => {
  const { amount, currency, category, vendor, description, receiptUrl, expenseDate } = dto;

  // Duplicate detection
  const duplicate = await expenseRepo.findDuplicate(user.id, amount, vendor, expenseDate);
  if (duplicate) throw new AppError('Duplicate expense detected', 'DUPLICATE_EXPENSE', 409);

  // Currency conversion
  const { convertedAmount, exchangeRate } = await currencyService.convertCurrency(
    currency.toUpperCase(),
    COMPANY_CURRENCY,
    amount
  );

  const expense = await expenseRepo.create({
    userId: user.id,
    amountOriginal: amount,
    currencyOriginal: currency.toUpperCase(),
    amountConverted: convertedAmount,
    currencyCompany: COMPANY_CURRENCY,
    exchangeRate,
    category,
    vendor,
    description,
    receiptUrl,
    expenseDate: new Date(expenseDate),
  });

  // Trigger approval workflow (non-blocking)
  approvalService.initiateWorkflow(expense, user).catch((err) => {
    const logger = require('../../utils/logger');
    logger.error('Failed to initiate approval workflow', err);
  });

  return expense;
};

const getExpenses = async (query, user) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100);
  const { status } = query;

  const [expenses, total] = await Promise.all([
    expenseRepo.findAll({ userId: user.id, role: user.role, companyId: user.companyId, status, page, limit }),
    expenseRepo.countAll({ userId: user.id, role: user.role, companyId: user.companyId, status }),
  ]);

  return { expenses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

module.exports = { createExpense, getExpenses };
