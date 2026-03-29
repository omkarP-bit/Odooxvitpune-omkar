const { success } = require('../../utils/response');
const prisma = require('../../config/db');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

const googleCallback = (req, res) => {
  const { token } = req.user;
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
};

const getMe = (req, res) => {
  const { user } = req;
  success(res, {
    id: user.publicId,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    companyName: user.companyName || null,
    currency: user.currency,
  });
};

const setupCompany = async (req, res, next) => {
  try {
    const { companyName, country, currency } = req.body;
    if (!companyName || !currency) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION', message: 'companyName and currency are required' },
      });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        companyName,
        currency,
        role: 'ADMIN',
      },
    });

    success(res, {
      id: updated.publicId,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      companyId: updated.companyId,
      companyName: updated.companyName,
      currency: updated.currency,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { googleCallback, getMe, setupCompany };
