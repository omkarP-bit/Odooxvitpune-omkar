const prisma = require('../../config/db');
const { getCurrencyByCountry } = require('../../utils/countryCurrency');

const findByEmail = (email) => prisma.user.findUnique({ where: { email } });

const findById = (id) => prisma.user.findUnique({ where: { id: BigInt(id) } });

const upsertGoogleUser = async ({ email, name, companyId }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({ where: { email }, data: { name } });
  }

  // Derive currency from email domain as country hint (fallback to USD)
  const country = companyId; // companyId is derived from email domain
  const currency = await getCurrencyByCountry(country);

  return prisma.user.create({
    data: { email, name, companyId, role: 'EMPLOYEE', currency },
  });
};

module.exports = { findByEmail, findById, upsertGoogleUser };
