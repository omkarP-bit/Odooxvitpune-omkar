const currencyService = require('./currency.service');
const { success } = require('../../utils/response');
const AppError = require('../../utils/AppError');

const convert = async (req, res, next) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) throw new AppError('from, to, amount are required', 'VALIDATION_ERROR');

    const result = await currencyService.convertCurrency(from.toUpperCase(), to.toUpperCase(), parseFloat(amount));
    success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { convert };
