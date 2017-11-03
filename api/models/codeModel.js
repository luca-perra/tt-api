// Load required packages
var mongoose = require('mongoose');

// Define our token schema
var CodeSchema   = new mongoose.Schema({
  value: { type: String, required: true },
  redirect_uri: { type: String, required: true },
  user_id: { type: String, required: true },
  client_id: { type: String, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('Code', CodeSchema);
