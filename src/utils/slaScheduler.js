const approvalService = require('../modules/approval/approval.service');
const logger = require('./logger');

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const start = () => {
  logger.info('SLA scheduler started');

  const run = async () => {
    try {
      await approvalService.processSlaBreaches();
    } catch (err) {
      logger.error('SLA scheduler error', err);
    }
  };

  run(); // run immediately on start
  setInterval(run, INTERVAL_MS);
};

module.exports = { start };
