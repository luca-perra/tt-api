// Load required packages
var Client = require('../models/clientModel');

// Create endpoint /api/client for POST
exports.postClients = function(req, res) {
  // Create a new instance of the Client model
  var client = new Client();

  // Set the client properties that came from the POST data
  client.name = req.body.name;
  client.id = req.body.id;
  client.secret = req.body.secret;
  client.user_id = req.user._id;

  // Save the client and check for errors
  client.save(function(err) {
    if (err) {
      return res.send(err);
    }
    res.json({
      message: 'Client successfully added!',
      data: client
    });
  });
};

// Create endpoint /api/clients for GET
exports.getClients = function(req, res) {
  // Use the Client model to find all clients
  Client.find({ user_id: req.user._id }, function(err, clients) {
    if (err) {
      return res.send(err);
    }
    res.json(clients);
  });
};

// Create endpoint /api/clients for GET
exports.removeClient = function(req, res) {
  Client.remove({
    _id: req.body.id
  }, function(err, task) {
    if (err) {
      return res.send(err);
    }
    res.json({ message: 'Client successfully deleted' });
  });
};
