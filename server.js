// === Load required packages ===
var express  = require('express');            // Import the Express web framework
var app      = express();                     // Create an instance of Express
var port     = process.env.PORT || 8080;      // Set the server port (from environment variable or default to 8080)

var mongoose = require('mongoose');           // MongoDB ORM for data modeling
mongoose.set('strictQuery', false);           // Allows more flexible query behavior in Mongoose

var passport = require('passport');           // Authentication middleware
var flash    = require('connect-flash');      // Middleware for storing and displaying flash messages

// === Middleware for request handling ===
var morgan       = require('morgan');         // HTTP request logger for development
var cookieParser = require('cookie-parser');  // Parses cookies in the HTTP request
var bodyParser   = require('body-parser');    // Parses incoming request bodies (JSON or form)
var session      = require('express-session');// Handles sessions to persist login state

// === Load database configuration ===
var configDB = require('./config/database.js'); // External file that holds DB connection string

// === Middleware configuration ===
app.use(morgan('dev'));                        // Log every request to the console
app.use(cookieParser());                       // Parse cookies from incoming requests
app.use(bodyParser.json());                    // Parse application/json
app.use(bodyParser.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded

app.use(express.static('public'));             // Serve static files (CSS, JS, images, etc.) from the "public" folder
app.set('view engine', 'ejs');                 // Set EJS as the templating engine

// === Passport and session configuration ===
app.use(session({
    secret: 'smartdesk-secret',               // Used to sign the session ID cookie
    resave: true,                             // Save session even if it's unmodified
    saveUninitialized: true                   // Save uninitialized sessions (useful for login)
}));
app.use(passport.initialize());               // Initialize Passport middleware
app.use(passport.session());                  // Persistent login sessions
app.use(flash());                             // Use flash messages for success/failure notices

// === Load Passport configuration ===
require('./config/passport')(passport);       // Pass Passport into the config file to customize strategies

// === Connect to MongoDB ===
mongoose.connect(configDB.url, {
  useNewUrlParser: true,                      // Use the new MongoDB connection string parser
  useUnifiedTopology: true                    // Use new server discovery & monitoring engine
})
.then(() => {
  console.log('✅ MongoDB Connected');

  // === Load routes after DB is connected ===
  require('./app/routes.js')(app, passport, mongoose.connection); // Inject app, passport, and db connection

  // === Start the server ===
  app.listen(port, () => {
    console.log('✅ Server running on port ' + port);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err); // Handle DB connection errors
});
