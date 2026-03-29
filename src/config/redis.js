const { createClient } = require('redis');
const logger = require('../utils/logger');

let client = null;

const connect = async () => {
  if (process.env.REDIS_ENABLED !== 'true') return;

  client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => logger.error('Redis error:', err));
  await client.connect();
  logger.info('Redis connected');
};

const get = async (key) => {
  if (!client) return null;
  const val = await client.get(key);
  return val ? JSON.parse(val) : null;
};

const set = async (key, value, ttlSeconds = 3600) => {
  if (!client) return;
  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

module.exports = { connect, get, set };
