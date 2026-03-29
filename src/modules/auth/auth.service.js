const { sign } = require('../../config/jwt');
const authRepo = require('./auth.repository');

const generateToken = (user) =>
  sign({
    user_id: user.id.toString(),
    role: user.role,
    company_id: user.companyId,
  });

const handleGoogleLogin = async (profile) => {
  const email = profile.emails[0].value;
  const name = profile.displayName;
  const companyId = email.split('@')[1]; // derive company from email domain

  const user = await authRepo.upsertGoogleUser({ email, name, companyId });
  const token = generateToken(user);

  return { user, token };
};

module.exports = { handleGoogleLogin, generateToken };
