'use strict';
module.exports = function(app) {
  var clientController = require('../controllers/clientController');
  var passport = require('passport');
  var authController = require('../controllers/authController');

  app.route('/clients')
    .post(authController.isAuthenticated, clientController.postClients)
    .get(authController.isAuthenticated, clientController.getClients)
    .delete(authController.isAuthenticated, clientController.removeClient);
};
