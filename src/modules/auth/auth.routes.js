const router = require('express').Router();
const passport = require('./auth.passport');
const authController = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/failure' }),
  authController.googleCallback
);

router.get('/failure', (req, res) =>
  res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message: 'Google authentication failed' } })
);

router.get('/me', authenticate, authController.getMe);
router.post('/setup-company', authenticate, authController.setupCompany);

module.exports = router;
