const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const companyId = 'acme.com';

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: { email: 'admin@acme.com', name: 'Alice Admin', role: 'ADMIN', companyId },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: {},
    create: { email: 'manager@acme.com', name: 'Bob Manager', role: 'MANAGER', companyId },
  });

  await prisma.user.upsert({
    where: { email: 'employee@acme.com' },
    update: {},
    create: {
      email: 'employee@acme.com',
      name: 'Charlie Employee',
      role: 'EMPLOYEE',
      companyId,
      managerId: manager.id,
    },
  });

  // Approval rules
  await prisma.rule.createMany({
    skipDuplicates: true,
    data: [
      {
        companyId,
        ruleType: 'AMOUNT_THRESHOLD',
        condition: { field: 'amount_converted', operator: '>', value: 5000 },
        action: { approver_role: 'ADMIN' },
      },
      {
        companyId,
        ruleType: 'AMOUNT_THRESHOLD',
        condition: { field: 'amount_converted', operator: '>', value: 500 },
        action: { approver_role: 'MANAGER' },
      },
    ],
  });

  // SLA rule
  await prisma.slaRule.createMany({
    skipDuplicates: true,
    data: [{ companyId, timeoutHours: 48, action: 'ESCALATE' }],
  });

  console.log('Seed complete ✓');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
