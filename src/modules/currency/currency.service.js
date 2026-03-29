const axios = require('axios');
const redis = require('../../config/redis');
const currencyRepo = require('./currency.repository');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

const CACHE_TTL = 3600; // 1 hour

const fetchRatesFromApi = async (base) => {
  const { data } = await axios.get(`${process.env.EXCHANGE_RATE_API_URL}/${base}`, { timeout: 5000 });
  return data.rates;
};

const getRates = async (base) => {
  const cacheKey = `rates:${base}`;

  // 1. Try Redis
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // 2. Try live API
  try {
    const rates = await fetchRatesFromApi(base);
    await redis.set(cacheKey, rates, CACHE_TTL);
    await currencyRepo.saveRates(base, rates);
    return rates;
  } catch (err) {
    logger.warn(`Exchange rate API failed, using DB fallback: ${err.message}`);
  }

  // 3. DB fallback
  const cached_db = await currencyRepo.getLatestRates(base);
  if (cached_db) return cached_db.rates;

  throw new AppError('Exchange rate unavailable', 'CURRENCY_UNAVAILABLE', 503);
};

const convertCurrency = async (from, to, amount) => {
  if (from === to) return { convertedAmount: amount, exchangeRate: 1 };

  const rates = await getRates(from);
  const exchangeRate = rates[to];

  if (!exchangeRate) throw new AppError(`Unsupported currency: ${to}`, 'INVALID_CURRENCY', 400);

  const convertedAmount = parseFloat((amount * exchangeRate).toFixed(2));
  return { convertedAmount, exchangeRate };
};

module.exports = { convertCurrency };
