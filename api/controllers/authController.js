// Load required packages
var passport = require('passport');
var crypto = require('crypto');
var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/userModel');
var Client = require('../models/clientModel');

var BearerStrategy = require('passport-http-bearer').Strategy;
var Token = require('../models/tokenModel');

var LocalStrategy = require('passport-local').Strategy;

passport.use(new BasicStrategy(
  function(username, password, callback) {
    User.findOne({ email: username }, function (err, user) {
      if (err) {
        return callback(err);
      }

      // No user found with that username
      if (!user) {
        return callback(null, false);
      }

      // Make sure the password is correct
      user.verifyPassword(password, function(err, isMatch) {
        if (err) {
          return callback(err);
        }

        // Password did not match
        if (!isMatch) {
          return callback(null, false);
        }

        // Success
        return callback(null, user);
      });
    });
  }
));

passport.use('client-basic', new BasicStrategy(
  function(username, password, callback) {
    Client.findOne({ id: username }, function (err, client) {
      if (err) { return callback(err); }

      // No client found with that id or bad password
      if (!client || client.secret !== password) { return callback(null, false); }

      // Success
      return callback(null, client);
    });
  }
));

passport.use(new BearerStrategy(
  function(accessToken, callback) {
    if (!accessToken) {
      return callback(null, false);
    }
    if (typeof accessToken !== 'string') {
      accessToken = accessToken[0];
    }
    var tokenHash = crypto.createHash('sha1').update(accessToken, 'utf-8').digest('hex');
    Token.findOne({ value: tokenHash }, function (err, token) {
      if (err) {
        return callback(err);
      }

      // No token found
      if (!token) {
        return callback(null, false);
      }

      if (new Date() > token.expiration_date) {
        return callback(null, false);
      }

      User.findOne({ _id: token.user_id }, function (err, user) {
        if (err) {
          return callback(err);
        }

        // No user found
        if (!user) {
          return callback(null, false);
        }

        // Simple example with no scope
        callback(null, user, { scope: '*' });
      });
    });
  }
));

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

// exports.isAuthenticated = passport.authenticate('basic', { session : false });
exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], { session : false });
exports.isClientAuthenticated = passport.authenticate('client-basic', { session : false });
exports.isBearerAuthenticated = passport.authenticate('bearer', { session: false });
