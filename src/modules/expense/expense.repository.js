const prisma = require('../../config/db');

const create = (data) => prisma.expense.create({ data });

const findDuplicate = (userId, amount, vendor, expenseDate) =>
  prisma.expense.findFirst({
    where: {
      userId: BigInt(userId),
      amountOriginal: amount,
      vendor,
      expenseDate: new Date(expenseDate),
    },
  });

const findAll = ({ userId, role, companyId, status, page, limit }) => {
  const where = {};

  if (role === 'EMPLOYEE') where.userId = BigInt(userId);
  else if (role === 'MANAGER') {
    // Manager sees their own + their team's expenses via subquery
    where.user = { OR: [{ id: BigInt(userId) }, { managerId: BigInt(userId) }] };
  }
  // ADMIN sees all in company
  else where.user = { companyId };

  if (status) where.status = status;

  return prisma.expense.findMany({
    where,
    include: { user: { select: { publicId: true, name: true, email: true } } },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
};

const countAll = ({ userId, role, companyId, status }) => {
  const where = {};
  if (role === 'EMPLOYEE') where.userId = BigInt(userId);
  else if (role === 'MANAGER') where.user = { OR: [{ id: BigInt(userId) }, { managerId: BigInt(userId) }] };
  else where.user = { companyId };
  if (status) where.status = status;
  return prisma.expense.count({ where });
};

const findByPublicId = (publicId) =>
  prisma.expense.findUnique({ where: { publicId }, include: { user: true } });

module.exports = { create, findDuplicate, findAll, countAll, findByPublicId };
