const prisma = require('../../config/db');
const approvalRepo = require('./approval.repository');
const { buildWorkflow } = require('./rule.engine');
const notificationService = require('../notification/notification.service');
const AppError = require('../../utils/AppError');

const SLA_HOURS_DEFAULT = 48;

/**
 * Called after expense creation — builds and persists approval steps.
 */
const initiateWorkflow = async (expense, submitter) => {
  const rules = await approvalRepo.getRulesForCompany(submitter.companyId);
  const slaRules = await approvalRepo.getSlaRules(submitter.companyId);
  const timeoutHours = slaRules[0]?.timeoutHours ?? SLA_HOURS_DEFAULT;

  const requiredRoles = buildWorkflow(rules, expense);

  // Find approvers by role in the same company
  const approvers = await prisma.user.findMany({
    where: { companyId: submitter.companyId, role: { in: requiredRoles } },
  });

  const roleToApprover = {};
  for (const a of approvers) roleToApprover[a.role] = a;

  const slaDeadline = new Date(Date.now() + timeoutHours * 3600 * 1000);

  const steps = requiredRoles
    .map((role, index) => {
      const approver = roleToApprover[role];
      if (!approver) return null;
      return {
        expenseId: expense.id,
        approverId: approver.id,
        stepOrder: index + 1,
        status: index === 0 ? 'PENDING' : 'SKIPPED', // only first step is active
        slaDeadline,
      };
    })
    .filter(Boolean);

  if (steps.length === 0) return;

  await approvalRepo.createApprovals(steps);

  // Notify first approver
  const firstApprover = approvers.find((a) => a.role === requiredRoles[0]);
  if (firstApprover) notificationService.notifyApprovalRequired(firstApprover, expense);
};

/**
 * Approve or reject an approval step.
 */
const decide = async (publicId, decision, comments, actingUser) => {
  const approval = await approvalRepo.findByPublicId(publicId);
  if (!approval) throw new AppError('Approval not found', 'NOT_FOUND', 404);
  if (approval.approverId !== actingUser.id) throw new AppError('Not your approval', 'FORBIDDEN', 403);
  if (approval.status !== 'PENDING') throw new AppError('Approval already decided', 'CONFLICT', 409);

  await approvalRepo.updateStatus(approval.id, decision, comments);

  const allSteps = await approvalRepo.findByExpense(approval.expenseId);

  if (decision === 'REJECTED') {
    // Reject expense immediately
    await prisma.expense.update({ where: { id: approval.expenseId }, data: { status: 'REJECTED' } });
    notificationService.notifyExpenseDecision(approval.expense.user, approval.expense, 'REJECTED');
    return;
  }

  // Activate next pending step
  const nextStep = allSteps.find((s) => s.stepOrder > approval.stepOrder && s.status === 'SKIPPED');
  if (nextStep) {
    await approvalRepo.updateStatus(nextStep.id, 'PENDING', null);
    notificationService.notifyApprovalRequired(nextStep.approver, approval.expense);
  } else {
    // All steps approved
    await prisma.expense.update({ where: { id: approval.expenseId }, data: { status: 'APPROVED' } });
    notificationService.notifyExpenseDecision(approval.expense.user, approval.expense, 'APPROVED');
  }
};

/**
 * SLA engine — run periodically (e.g., cron every 15 min).
 */
const processSlaBreaches = async () => {
  const breached = await approvalRepo.findPendingOverSla();

  for (const approval of breached) {
    const slaRules = await approvalRepo.getSlaRules(approval.expense.user.companyId);
    const action = slaRules[0]?.action ?? 'ESCALATE';

    await approvalRepo.updateStatus(approval.id, 'ESCALATED', 'SLA breached — auto escalated');
    notificationService.notifySlaBreached(approval.approver, approval.expense, action);

    if (action === 'AUTO_REJECT') {
      await prisma.expense.update({ where: { id: approval.expenseId }, data: { status: 'REJECTED' } });
    }
  }
};

const listPending = (user, page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  return approvalRepo.findPendingByApprover(user.id, pageNum, limitNum);
};

module.exports = { initiateWorkflow, decide, processSlaBreaches, listPending };
