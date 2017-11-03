// Load required packages
var oauth2orize = require('oauth2orize');
var bcrypt = require('bcrypt-nodejs');
var User = require('../models/userModel');
var Client = require('../models/clientModel');
var Token = require('../models/tokenModel');
var RefreshToken = require('../models/refreshTokenModel');
var Code = require('../models/codeModel');
var passport = require('passport');
var crypto = require('crypto');

// Create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization function
server.serializeClient(function(client, callback) {
  return callback(null, client._id);
});

// Register deserialization function
server.deserializeClient(function(id, callback) {
  Client.findOne({ _id: id }, function(err, client) {
    if (err) { return callback(err); }
    return callback(null, client);
  });
});

// Register authorization code grant type
server.grant(oauth2orize.grant.code(function(client, redirectUri, user, ares, callback) {
  // Create a new authorization code
  var code = new Code({
    value: uid(16),
    client_id: client._id,
    redirect_uri: redirectUri,
    user_id: user._id
  });

  // Save the auth code and check for errors
  code.save(function(err) {
    if (err) {
      return callback(err);
    }

    callback(null, code.value);
  });
}));

// Exchange authorization codes for access tokens
server.exchange(oauth2orize.exchange.code(function(client, code, redirectUri, callback) {
  Code.findOne({ value: code }, function(err, authCode) {
    if (err) {
      return callback(err);
    }
    if (!authCode) {
      return callback(null, false);
    }
    if (client._id.toString() !== authCode.client_id) {
      return callback(null, false);
    }
    if (redirectUri !== authCode.redirect_uri) {
      return callback(null, false);
    }

    // Delete auth code now that it has been used
    authCode.remove(function(err) {
      if (err) {
        return callback(err);
      }

      // Create a new access token
      var token = new Token({
        value: uid(256),
        client_id: authCode.client_id,
        user_id: authCode.user_id
      });

      // Save the access token and check for errors
      token.save(function(err) {
        if (err) {
          return callback(err);
        }

        callback(null, token);
      });
    });
  });
}));

server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, callback) {
  User.findOne({ email: username }, function (err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback(null, false);
    }
    bcrypt.compare(password, user.password, function (err, res) {
      if (!res) {
        return callback(null, false);
      }

      // Remove existing access token
      Token.findOneAndRemove({
        client_id: client._id,
        user_id: user._id
      }, function(err) {
        if (err) {
          return res.send(err);
        }
        // Remove existing refresh token
        RefreshToken.findOneAndRemove({
          client_id: client._id,
          user_id: user._id
        }, function(err) {
          if (err) {
            return res.send(err);
          }

          var token = uid(256);
          var refreshToken = uid(256);
          var tokenHash = crypto.createHash('sha1').update(token, 'utf-8').digest('hex');
          var refreshTokenHash = crypto.createHash('sha1').update(refreshToken, 'utf-8').digest('hex');

          // var expirationDate = new Date(new Date().getTime() + (24 * 3600 * 1000));
          var expirationDate = new Date(new Date().getTime() + (30 * 1000));

          // Create a new access token
          var newToken = new Token({
            value: tokenHash,
            expiration_date: expirationDate,
            client_id: client._id,
            user_id: user._id
          });

          newToken.save(function (err) {
            if (err) {
              return callback(err);
            }

            // expirationDate = new Date(new Date().getTime() + (48 * 3600 * 1000));
            expirationDate = new Date(new Date().getTime() + (60 * 1000));

            // Create a new refresh token
            var newRefreshToken = new RefreshToken({
              value: refreshTokenHash,
              expiration_date: expirationDate,
              client_id: client._id,
              user_id: user._id
            });

            newRefreshToken.save(function(err) {
              if (err) {
                return callback(err);
              }

              callback(null, token, refreshToken, {expires_in: expirationDate});
            });
          });
        });
      });
    });
  });
}));

//Refresh Token
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, callback) {
  var refreshTokenHash = crypto.createHash('sha1').update(refreshToken, 'utf-8').digest('hex');
  RefreshToken.findOne({ value: refreshTokenHash }, function (err, token) {
    if (err) {
      return callback(err);
    }

    if (!token || new Date() > token.expiration_date || client._id != token.client_id) {
      return callback(null, false);
    }

    var newRefreshToken = uid(256);
    var refreshTokenHash = crypto.createHash('sha1').update(newRefreshToken, 'utf-8').digest('hex');
    // var expirationDate = new Date(new Date().getTime() + (48 * 3600 * 1000));
    var expirationDate = new Date(new Date().getTime() + (60 * 1000));

    token.value = refreshTokenHash;
    token.expiration_date = expirationDate;

    // Update refresh token
    token.save(function (err) {
      if (err) {
        return callback(err);
      }

      var newAccessToken = uid(256);
      var accessTokenHash = crypto.createHash('sha1').update(newAccessToken, 'utf-8').digest('hex');
      // var expirationDate = new Date(new Date().getTime() + (24 * 3600 * 1000));
      var expirationDate = new Date(new Date().getTime() + (30 * 1000));

      // Update access token
      Token.findOneAndUpdate({
        client_id: client._id,
        user_id: token.user_id
      }, { $set:{
        value: accessTokenHash,
        expiration_date: expirationDate
      } }, { new: true }, function(err, accessToken) {
        if (err) {
          return callback(err);
        }

        callback(null, newAccessToken, newRefreshToken, {expires_in: expirationDate});
      });
    });
  });
}))

// User authorization endpoint
exports.authorization = [
  server.authorization(function(clientId, redirectUri, callback) {

    Client.findOne({ id: clientId }, function (err, client) {
      if (err) {
        return callback(err);
      }

      return callback(null, client, redirectUri);
    });
  }),
  function(req, res) {
    res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
]

// User decision endpoint
exports.decision = [
  server.decision()
]

// Application client token exchange endpoint
exports.token = [
  passport.authenticate(['client-basic'], { session: false }),
  server.token(),
  server.errorHandler()
]

function uid(len) {
  var buf = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
