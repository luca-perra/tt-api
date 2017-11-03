'use strict';
module.exports = function(app) {
  var userController = require('../controllers/userController');
  var passport = require('passport');
  var authController = require('../controllers/authController');

  app.route('/users')
    .post(userController.postUsers)
    .get(authController.isAuthenticated, userController.getUsers);

  app.route('/me')
    .get(authController.isAuthenticated, userController.getUser);
};
