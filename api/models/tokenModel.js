// Load required packages
var mongoose = require('mongoose');

// Define our token schema
var TokenSchema = new mongoose.Schema({
  value: { type: String, required: true },
  user_id: { type: String, required: true },
  client_id: { type: String, required: true },
  scope: { type: String, required: false },
  expiration_date: { type: Date, required: true }
});

// Export the Mongoose model
module.exports = mongoose.model('Token', TokenSchema);
