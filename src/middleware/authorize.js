const AppError = require('../utils/AppError');

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions', 'FORBIDDEN', 403));
  }
  next();
};

module.exports = authorize;
