var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
var config = require('../config/database');
var bcrypt = require('bcryptjs');


module.exports = function(passport){

  // Local Strategy
  passport.use(new LocalStrategy ({usernameField: 'email'}, // Change the username field to email
    // (by default, LocalStrategy looks for the fields "username" and "password" but we want users to login with email)
    function(username, password, done) {
      // Match email
      var query = {email: username};
      User.findOne(query, function(err, user){
        if(err) throw err;
        // No user found
        if(!user){
          return done(null, false, {message: 'Incorrect username or password'});
        }
        // Match password
        bcrypt.compare(password, user.password, function(err, isMatch){
          if (err) throw err;
          if(isMatch){
            return done(null, user);
          } else {
            return done(null, false, {message: 'Incorrect username or password'});
          }
        });
      });
    }

  ));


  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

}
