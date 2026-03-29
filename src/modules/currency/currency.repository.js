const prisma = require('../../config/db');

const saveRates = (baseCurrency, rates) =>
  prisma.exchangeRateCache.create({ data: { baseCurrency, rates } });

const getLatestRates = (baseCurrency) =>
  prisma.exchangeRateCache.findFirst({
    where: { baseCurrency },
    orderBy: { fetchedAt: 'desc' },
  });

module.exports = { saveRates, getLatestRates };
