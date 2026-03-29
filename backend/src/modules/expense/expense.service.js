const { v4: uuidv4 } = require("uuid");
const {
    createExpense,
    findPotentialDuplicate,
    listExpensesByEmployee
} = require("../../models/expenseModel");
const { findUserById } = require("../../models/userModel");
const { convertCurrency } = require("../../utils/currency");
const { parseReceiptText } = require("../../utils/ocr");
const { buildApprovalStepsForExpense } = require("../approval/approval.service");

const submitExpense = async ({ userId, payload }) => {
    const user = await findUserById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    if (user.role !== "employee") {
        throw new Error("Only employees can submit expenses");
    }

    const { amount, currency, category, description, date, receiptText } = payload;

    const ocrData = parseReceiptText(receiptText || "");
    const normalizedAmount = Number(amount || ocrData.parsedAmount || 0);
    const normalizedDate = date || ocrData.parsedDate || new Date().toISOString().slice(0, 10);

    if (!normalizedAmount || !currency || !category) {
        throw new Error("amount, currency and category are required");
    }

    const duplicate = await findPotentialDuplicate({
        employeeId: user.id,
        amountOriginal: normalizedAmount,
        originalCurrency: String(currency).toUpperCase(),
        expenseDate: normalizedDate,
        category
    });

    if (duplicate) {
        throw new Error("Potential duplicate expense detected");
    }

    const amountInCompanyCurrency = await convertCurrency({
        amount: normalizedAmount,
        fromCurrency: String(currency).toUpperCase(),
        toCurrency: user.currency_code
    });

    const expense = await createExpense({
        publicId: uuidv4(),
        companyId: user.company_id,
        employeeId: user.id,
        amountOriginal: normalizedAmount,
        originalCurrency: String(currency).toUpperCase(),
        amountCompanyCurrency: amountInCompanyCurrency,
        companyCurrency: user.currency_code,
        category,
        description: description || ocrData.parsedMerchant || null,
        expenseDate: normalizedDate,
        receiptText: receiptText || ocrData.rawText
    });

    const workflow = await buildApprovalStepsForExpense({ expense, employee: user });

    return {
        expense,
        workflow,
        ocr: ocrData
    };
};

const myExpenses = async ({ userId }) => {
    const user = await findUserById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    return listExpensesByEmployee(user.id);
};

module.exports = {
    submitExpense,
    myExpenses
};
