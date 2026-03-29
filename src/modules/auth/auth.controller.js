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

const listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { companyId: req.user.companyId },
      select: { publicId: true, name: true, email: true, role: true, managerId: true, manager: { select: { publicId: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    success(res, users.map(u => ({
      id: u.publicId, publicId: u.publicId, name: u.name, email: u.email, role: u.role,
      managerId: u.manager?.publicId ?? null, managerName: u.manager?.name ?? null,
    })));
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const { role, managerId } = req.body;
    const target = await prisma.user.findUnique({ where: { publicId: req.params.id } });
    if (!target || target.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    const data = {};
    if (role && ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) data.role = role;
    if (managerId !== undefined) {
      if (managerId) {
        const mgr = await prisma.user.findUnique({ where: { publicId: managerId } });
        if (mgr) data.managerId = mgr.id;
      } else {
        data.managerId = null;
      }
    }
    const updated = await prisma.user.update({ where: { id: target.id }, data });
    success(res, { id: updated.publicId, role: updated.role });
  } catch (err) { next(err); }
};

module.exports = { googleCallback, getMe, setupCompany, listUsers, updateUser };
