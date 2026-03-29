const approvalService = require('./approval.service');
const { success } = require('../../utils/response');
const AppError = require('../../utils/AppError');

const list = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const approvals = await approvalService.listPending(req.user, page, limit);
    success(res, approvals);
  } catch (err) {
    next(err);
  }
};

const decide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      throw new AppError('decision must be APPROVED or REJECTED', 'VALIDATION_ERROR');
    }

    await approvalService.decide(id, decision, comments, req.user);
    success(res, { message: `Expense ${decision.toLowerCase()} successfully` });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, decide };
