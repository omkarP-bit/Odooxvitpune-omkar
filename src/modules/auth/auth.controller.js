const { success } = require('../../utils/response');

const googleCallback = (req, res) => {
  const { user, token } = req.user; // set by passport
  success(res, {
    token,
    user: {
      id: user.publicId,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
};

const getMe = (req, res) => {
  const { user } = req;
  success(res, {
    id: user.publicId,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
  });
};

module.exports = { googleCallback, getMe };
