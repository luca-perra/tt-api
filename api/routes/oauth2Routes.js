'use strict';
module.exports = function(app) {
  var oauth2Controller = require('../controllers/oauth2Controller');
  var passport = require('passport');
  var authController = require('../controllers/authController');

  // Create endpoint handlers for oauth2 authorize
  app.route('/oauth2/authorize')
    .get(authController.isAuthenticated, oauth2Controller.authorization)
    .post(authController.isAuthenticated, oauth2Controller.decision);

  // Create endpoint handlers for oauth2 token
  app.route('/oauth2/token')
    .post(authController.isClientAuthenticated, oauth2Controller.token);
};
