const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path });

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).end(
    JSON.stringify({ success: false, error: { code, message } }, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    )
  );
};

module.exports = errorHandler;
