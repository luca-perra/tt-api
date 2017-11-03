var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var bodyParser = require('body-parser');
var ejs = require('ejs');
var session = require('express-session');
// var cors = require('cors');

// Set view engine to ejs
app.set('view engine', 'ejs');

var mongoose = require('mongoose');
// mongoose.set('debug', true);
var mongoUri = 'mongodb://localhost/tt_project';

mongoose.Promise = global.Promise;
mongoose.connect(mongoUri, function(err, res) {
  if (err) {
    return console.error('Error connecting to "%s":', mongoUri, err);
  }
  console.log('Connected successfully to "%s"', mongoUri);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use express session support since OAuth2orize requires it
app.use(session({
  secret: 'Super Secret Session Key',
  saveUninitialized: true,
  resave: true
}));

// app.use(cors({credentials: true}));

// Add headers
app.use(function (req, res, next) {
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Origin, Authorization, Accept, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
  }

  if (req.method === 'OPTIONS') {
    res.end();
  }
  else {
    next();
  }
});

require('./api/routes/todoListRoutes')(app);
require('./api/routes/userRoutes')(app);
require('./api/routes/clientRoutes')(app);
require('./api/routes/oauth2Routes')(app);

app.listen(port);

console.log('tt RESTful API server started on: ' + port);
