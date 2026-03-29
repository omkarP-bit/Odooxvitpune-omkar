const jwt = require('jsonwebtoken');

const privateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const publicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');

const sign = (payload) =>
  jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const verify = (token) => jwt.verify(token, publicKey, { algorithms: ['RS256'] });

module.exports = { sign, verify };
