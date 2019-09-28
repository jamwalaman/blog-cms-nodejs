// User model
var User = require('../models/user');
// Blog model
var Blog = require('../models/blog');

var app = require('../app');
var async = require('async');
var passport = require('passport');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');
const bcryptjs = require('bcryptjs');


// GET request. Display the user registration form
exports.user_create_get = function (req, res) {

	res.render('register', {title: 'Sign up'});

}


// POST request. Process the user registration form
exports.user_create_post = [

  /// Validate fields. ///

	// EMAIL
  body('email', 'Email is required').isLength({min:1}).isEmail().withMessage('Email not valid').trim().custom(value => {
		// 'value' is what the user entered in the 'email' field
		var query = {email: value};
		return User.findOne(query).then(email => {
			// Throw an error if email is found in the database
			if (email) {
				throw new Error (`Email ${value} is already registered. Please choose a different email`);
			}
		});
	}),
	// USERNAME
  body('username', 'Username is required').isLength({min:1}).isAlphanumeric().withMessage('Username should only have numbers and letters, with no space').trim().custom(value => {
		// 'value' is what the user entered in the 'username' field
		var query = {username: value};
		return User.findOne(query).then(username => {
			if (username) {
				// Throw an error if the username is found in the database
				throw new Error (`Username ${value} is already registered. Please choose a different username`);
			}
		});
	}),
	// PASSWORD
  body('password', 'Password is required').custom( (value, {req}) => {
    if (value !== req.body.password2) {
      throw new Error("Passwords dont match");
    } else {
      return value;
    }
  } ),

  // Sanitize fields.
  sanitizeBody('email').escape(),
  sanitizeBody('username').escape(),
  sanitizeBody('password').escape(),
  sanitizeBody('password2').escape(),

  // Process request after validation and sanitization.
  (req, res) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      /* There are errors. Render form again with sanitized values/errors messages.

			onlyFirstError: true
			Setting this to true means only the first error will be shown for a field
			So if no email is given by the user, the error 'Email is required' will be shown and not 'Email not valid' */
      res.render('register', { title: 'Sign up', register: req.body, errors: errors.array({onlyFirstError: true}) });
      return;
    } else {
      // Data form valid. Create the new user
      var newUser = new User ({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
      });
      // Hash password using bcryptjs. The generated salt will be 10 characters long
      bcryptjs.genSalt(10, function(err, salt) {
        bcryptjs.hash(newUser.password, salt, function(err, hash) {
          if(err) {
            console.log(err);
          }
          newUser.password = hash;
          newUser.save(function(err) {
            if(err) {
              console.log(err);
              return;
            } else {
              req.flash('success', 'Successfully registered as a new user');
              res.redirect('/');
            }
          });
        });
      });
    }

  }

]

// Display detail page for a specific User
exports.user_detail = function(req, res, next) {

	// number of blogs per page
	var perPage = 5;
	// current page
	var currentPage = (req.params.page) ? Number(req.params.page) : 1;

	async.parallel({
		user: function(callback) {
			// from the Users model, find user by id
			User.findById(req.params.id)
			.exec(callback)
		},
		users_blogs: function(callback) {
			var query = {};
			query.author = req.params.id;
			// Show only public blogs if there's no logged in user. Or if the logged in user is not looking at their profile
			if (!req.isAuthenticated() || (req.isAuthenticated() && req.user.id != req.params.id)) {
				query.visible = true;
			}
			Blog.find(query)
			.skip((perPage * currentPage) - perPage)
			.limit(perPage)
			.sort([ ['createdAt', 'descending'] ]) // sort by most recent blogs (by createdAt date)
			.exec(callback)
		},
		users_blogs_count: function(callback) {
			var query = {};
			query.author = req.params.id;
			// Count only public blogs if there's no logged in user
			if (!req.isAuthenticated() || (req.isAuthenticated() && req.user.id != req.params.id)) {
				query.visible = true;
			}
			Blog.countDocuments(query).exec(callback)
		},
		users_private_blogs_count: function(callback) {
			Blog.countDocuments({'author': req.params.id, 'visible': false}).exec(callback)
		}
	}, function(err, results) {

		// error in api usage
		if (err && (req.app.get('env') === 'development')) {
			return next(err);
		}
		// Totalnumber of pages
		var numOfPages = Math.ceil(results.users_blogs_count / perPage);
		var pageNumArr = [];
		for (var i = 1; i <= numOfPages; i++) {pageNumArr.push(i)}
		if (pageNumArr.length && !pageNumArr.includes(currentPage)) {
			var err = new Error('No user found');
			err.status = 404;
			return next(err);
		}
		// Successful, so render
		res.render('user_profile', {
			title: 'All blogs by ' + results.user.username,
			user_detail: results.user,
			users_blogs: results.users_blogs,
			users_blogs_count: results.users_blogs_count,
			users_private_blogs_count: results.users_private_blogs_count,
			numOfPages: numOfPages,
			currentPage: currentPage
		});

	});

}


// GET request. Display the user login form
exports.user_login_get = function (req, res) {

	res.render('login', {title: 'Login'});

}


// POST request. Process the user login form
exports.user_login_post = function (req, res, next) {

	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/users/login',
		failureFlash: true
	})(req, res, next);

}


// GET request. Logout user
exports.user_logout_get = function (req, res) {
	req.logout();
	req.flash('success', 'Logged out successfully');
	res.redirect('/');
}
