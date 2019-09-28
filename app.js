var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
var moment = require('moment');
var favicon = require('serve-favicon')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');  //Import routes for "catalog" area of site

var compression = require('compression');
var helmet = require('helmet');

var app = express();

app.use(favicon(path.join(__dirname, 'favicon.ico')))

// Database connection
var mongoose = require('mongoose');
// Database URL for local development
var devDB = 'mongodb://localhost:27017/blogsite_db_dev';
// Use the production url if it's the prodcution environment
var mongoDB = process.env.MONGODB_URI || devDB;
mongoose.connect(mongoDB, {useNewUrlParser: true});
var db = mongoose.connection;

// Check connection
db.once('open', function(){
	console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
	console.log(err);
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.use(compression()); // Compress all routes
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
var sess = {
  secret: 'tardis',
  resave: true,
	cookie: {},
	saveUninitialized: true
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
}

app.use(session(sess));

// Passport config
require('./config/passport')(passport);
// Passprot Middleware
app.use(passport.initialize());
app.use(passport.session());

app.all('*', function(req, res, next){
	res.locals.user = req.user || null;
	next();
});

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
	// set local variable 'messages' used in layout.pug to display erros messsages
  res.locals.messages = require('express-messages')(req, res);
	// set local variable 'currentURL'
	res.locals.currentURL = req.originalUrl;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);  // Add catalog routes to middleware chain.
app.get('/favicon.ico', (req, res) => res.status(204));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.locals.moment = moment;

module.exports = app;
