const expenseService = require('./expense.service');
const { success } = require('../../utils/response');
const AppError = require('../../utils/AppError');

const create = async (req, res, next) => {
  try {
    const { amount, currency, category, vendor, description, receiptUrl, expenseDate } = req.body;

    if (!amount || !currency || !category || !expenseDate) {
      throw new AppError('amount, currency, category, expenseDate are required', 'VALIDATION_ERROR');
    }

    const expense = await expenseService.createExpense(req.body, req.user);
    success(res, { id: expense.publicId, status: expense.status }, 201);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await expenseService.getExpenses(req.query, req.user);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list };
