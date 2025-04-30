// Import the LocalStrategy from passport-local for username/password auth
const LocalStrategy = require('passport-local').Strategy;

// Import your User model
const User = require('../app/models/user');

module.exports = function(passport) {
  // === Required for persistent login sessions ===
  
  // Stores the user ID in the session
  passport.serializeUser((user, done) => done(null, user.id));

  // Retrieves the full user object from the database using the ID stored in session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // === Local Signup Strategy ===
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',         // Use 'email' instead of the default 'username'
    passwordField: 'password',
    passReqToCallback: true         // Allows passing `req` to the callback so we can access flash messages
  }, async (req, email, password, done) => {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 'local.email': email });
      if (existingUser) {
        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
      }

      // Create a new user
      const newUser = new User();
      newUser.local.email = email;
      newUser.local.password = newUser.generateHash(password); // Hash the password
      await newUser.save();

      return done(null, newUser); // Return the new user to Passport
    } catch (err) {
      return done(err); // Handle any errors
    }
  }));

  // === Local Login Strategy ===
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',          // Match login form field
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      // Find user by email
      const user = await User.findOne({ 'local.email': email });
      if (!user) {
        return done(null, false, req.flash('loginMessage', 'No user found.'));
      }

      // Check password validity
      if (!user.validPassword(password)) {
        return done(null, false, req.flash('loginMessage', 'Wrong password.'));
      }

      // Auth success
      return done(null, user);
    } catch (err) {
      return done(err); // Handle error
    }
  }));
};
