require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const redis = require('./config/redis');
const slaScheduler = require('./utils/slaScheduler');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const expenseRoutes = require('./modules/expense/expense.routes');
const approvalRoutes = require('./modules/approval/approval.routes');
const currencyRoutes = require('./modules/currency/currency.routes');
const ocrRoutes = require('./modules/ocr/ocr.routes');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Rate limiting
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/ocr', ocrRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
  await redis.connect();
  slaScheduler.start();

  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
};

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});

module.exports = app;
