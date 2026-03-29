const prisma = require('../../config/db');

const createApprovals = (data) => prisma.approval.createMany({ data });

const findByExpense = (expenseId) =>
  prisma.approval.findMany({
    where: { expenseId: BigInt(expenseId) },
    orderBy: { stepOrder: 'asc' },
    include: { approver: true },
  });

const findPendingByApprover = async (approverId, page, limit) => {
  const where = { approverId: BigInt(approverId), status: 'PENDING' };
  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      include: { expense: { include: { user: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.approval.count({ where }),
  ]);
  return { approvals, total };
};

const findByPublicId = (publicId) =>
  prisma.approval.findUnique({
    where: { publicId },
    include: { expense: { include: { user: true } }, approver: true },
  });

const updateStatus = (id, status, comments) =>
  prisma.approval.update({
    where: { id: BigInt(id) },
    data: { status, comments, decidedAt: new Date() },
  });

const findPendingOverSla = () =>
  prisma.approval.findMany({
    where: {
      status: 'PENDING',
      slaDeadline: { lt: new Date() },
    },
    include: { expense: { include: { user: true } }, approver: true },
  });

const getRulesForCompany = (companyId) =>
  prisma.rule.findMany({ where: { companyId, isActive: true } });

const getSlaRules = (companyId) =>
  prisma.slaRule.findMany({ where: { companyId, isActive: true } });

module.exports = {
  createApprovals,
  findByExpense,
  findPendingByApprover,
  findByPublicId,
  updateStatus,
  findPendingOverSla,
  getRulesForCompany,
  getSlaRules,
};
