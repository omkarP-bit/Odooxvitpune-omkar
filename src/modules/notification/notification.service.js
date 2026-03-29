const logger = require('../../utils/logger');

const notify = (type, payload) => {
  logger.info(`[NOTIFICATION] ${type}`, payload);
};

const notifyApprovalRequired = (approver, expense) =>
  notify('APPROVAL_REQUIRED', {
    to: approver.email,
    expenseId: expense.publicId,
    amount: expense.amountOriginal,
    currency: expense.currencyOriginal,
  });

const notifySlaBreached = (approver, expense, action) =>
  notify('SLA_BREACHED', {
    to: approver.email,
    expenseId: expense.publicId,
    action,
  });

const notifyExpenseDecision = (user, expense, status) =>
  notify('EXPENSE_DECISION', {
    to: user.email,
    expenseId: expense.publicId,
    status,
  });

module.exports = { notifyApprovalRequired, notifySlaBreached, notifyExpenseDecision };
