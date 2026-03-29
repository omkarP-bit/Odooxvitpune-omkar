const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const authService = require('./auth.service');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { user, token } = await authService.handleGoogleLogin(profile);
        done(null, { user, token });
      } catch (err) {
        done(err);
      }
    }
  )
);

module.exports = passport;
