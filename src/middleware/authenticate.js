const { verify } = require('../config/jwt');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verify(token);

    const user = await prisma.user.findUnique({ where: { id: BigInt(payload.user_id) } });
    if (!user) throw new AppError('User not found', 'UNAUTHORIZED', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Invalid token', 'UNAUTHORIZED', 401));
  }
};

module.exports = authenticate;
