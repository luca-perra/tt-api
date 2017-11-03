// Load required packages
var User = require('../models/userModel');
var Token = require('../models/tokenModel');

var crypto = require('crypto');

// Create endpoint /users for POST
exports.postUsers = function(req, res) {
  var user = new User({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password
  });

  user.save(function(err) {
    if (err) {
      return res.send(err);
    }

    res.json({ message: 'New user created' });
  });
};

// Create endpoint /users for GET
exports.getUsers = function(req, res) {
  User.find(function(err, users) {
    if (err) {
      return res.send(err);
    }

    res.json(users);
  });
};

// Create endpoint /user for GET
exports.getUser = function(req, res) {
  var accessToken = req.query.access_token;
  if (typeof accessToken !== 'string') {
    accessToken = accessToken[0];
  }
  var tokenHash = crypto.createHash('sha1').update(accessToken, 'utf-8').digest('hex');
  Token.findOne({ value: tokenHash }, function(err, token) {
    if (err) {
      return res.send(err);
    }
    User.findOne({ _id: token.user_id }, function(err, user) {
      if (err) {
        return res.send(err);
      }

      user = user.toObject({
        versionKey: false,
        virtuals: false,
        getters: false
      });
      delete user.password;
      delete user.created_date;

      res.json(user);
    });
  });
};
