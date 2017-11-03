'use strict';
module.exports = function(app) {
  var todoList = require('../controllers/todoListController');
  var passport = require('passport');
  var authController = require('../controllers/authController');

  // todoList Routes
  app.route('/tasks')
    .get(authController.isAuthenticated, todoList.list_all_tasks)
    .post(authController.isAuthenticated, todoList.create_a_task);

  app.route('/tasks/:taskId')
    .get(authController.isAuthenticated, todoList.read_a_task)
    .put(authController.isAuthenticated, todoList.update_a_task)
    .delete(authController.isAuthenticated, todoList.delete_a_task);
};
