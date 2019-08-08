// Blog model
var Blog = require('../models/blog');
// User model
var User = require('../models/user');

var app = require('../app');
var async = require('async');

const {body, validationResult} = require('express-validator/check');
const {sanitizeBody} = require('express-validator/filter');


// GET request for Home page.
exports.index = function(req, res) {

	async.parallel({
		count: function(callback) {
			// Count all public blogs
			Blog.countDocuments({'visible': true})
			.exec(callback)
		},
		recent_blogs: function(callback) {
			// Find all blogs where the user has set the visibility to public
			Blog.find({'visible': true})
			.sort([ ['createdAt', 'descending'] ]) // sort by most recent blogs (by createdAt date)
			.populate('author')
			.limit(6) //Only want 6 recent blogs for the home page
			.exec(callback)
		}
	}, function(err, results) {
		res.render('index', { title: 'Home ', error: err, count: results.count, recent_blogs: results.recent_blogs });
	});

};


// GET request. Display a list of all blogs
exports.blog_list_get = function(req, res, next) {

	// Find all blogs where the user has set the visibility to public
	Blog.find({'visible': true})
		.sort([ ['createdAt', 'descending'] ]) // sort by most recent blogs (by createdAt date)
		.populate('author')
		.exec(function (err, get_blogs) {
			if (err) {return next(err);}
			// Successful, so render
			res.render('blog_list', {title: 'Blog List', all_blogs: get_blogs});
		});

}


// Display detail for a specific blog
exports.blog_detail = function (req, res, next) {

	async.parallel({
		blog: function(callback) {
			Blog.findById(req.params.id)
			.populate('author')
			.exec(callback);
		},
	}, function(err, results) {
		// error in api usage
		if (err && (req.app.get('env') === 'development')) {
			return next(err);
		}
		if (results.blog==null) { // No results. (app.get('env') === 'production')
			var err = new Error('Blog not found');
			err.status = 404;
			return next(err);
		}
		// Blog is private
		if (!results.blog.visible) {
			/* Blog is private, check for two conditions:
				1) Make sure there is an authenticated user. There must be a user to view a private blog
				2) If there is an authenticated user, make sure that they created the blog
			If either of the condition is true, the user is redirected to the index page */
			if( (!req.isAuthenticated()) || (req.isAuthenticated() && (results.blog.author.id != req.user._id)) ) {
				req.flash('danger', 'Private blog');
				return res.redirect('/');
			}
		}
		// Successful, so render.
		res.render('blog_detail', { title: results.blog.title, blog: results.blog } );
	});

}


// GET request. Display blog create form
exports.blog_create_get = function (req, res, next) {
	res.render('blog_create', {title: 'Create a blog'});
}


// POST request. Process the blog create form
exports.blog_create_post = [

	// Validate fields.
	body('title').isLength({min:1}).trim().withMessage("Blog title is required"),
	body('content').isLength({min:1}).trim().withMessage("Blog content is required"),
	body('visibility').isBoolean().trim().withMessage("Please choose the blog's visibility"),

	// Sanitize fields.
	sanitizeBody('title').escape(),
	sanitizeBody('content').escape(),
	sanitizeBody('visibility').escape(),

	// Process request after validation and sanitization.
	(req, res) => {

		// Extract the validation errors from a request.
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/errors messages.
			res.render('blog_create', {title: 'Create a blog', blog: req.body,  errors: errors.array()});
			return;
		} else {
			// Data from the form is valid. Create the new blog
			var blog = new Blog ({
				title: req.body.title,
				author: req.user._id,
				content: req.body.content,
				visible: req.body.visibility
			});
			blog.save(function(err) {
				// Error in saving blog
				if(err) {
					console.log(err);
					return;
				} else {
					// No error. Save blog to the database
					req.flash('success', 'Blog created successfully');
					res.redirect(blog.url);
				}
			});
		}

	}

]


// Display Blog update form on GET.
exports.blog_update_get = function (req, res) {

	Blog.findById(req.params.id)
		.populate('author')
		.exec(function (err, blog_model) {
			if (err) {return next(err);}
			if(blog_model.author.id != req.user._id)  {
				req.flash('danger', 'Not Authorized');
				return res.redirect('/');
			}
			// Successful, so render
			res.render('blog_update', {title: 'Update blog - ' + blog_model.title, blog: blog_model});
		});

}


// Display blog update form on POST
exports.blog_update_post = [

	// Validate fields.
	body('title').isLength({min:1}).trim().withMessage('Blog title is required'),
	body('content').isLength({min:1}).trim().withMessage('Blog content is required'),
	body('visibility').isBoolean().trim().withMessage("Please choose the blog's visibility"),

	// Sanitize fields.
	sanitizeBody('title').escape(),
	sanitizeBody('content').escape(),
	sanitizeBody('visibility').escape(),

	// Process request after validation and sanitization.
	(req, res) => {

		// Extract the validation errors from a request.
		const errors = validationResult(req);
		// Blog object
		var blog = {};
		blog.title = req.body.title;
		blog.content = req.body.content;
		blog.visible = req.body.visibility;
		// Query. Update blog that matches the id
		var query = {_id:req.params.id};

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/errors messages.
			res.render('blog_update', {title: 'Update blog - ' + blog.title, blog: blog,  errors: errors.array()});
			return;
		}
		// Data from form is valid. Update blog
		Blog.updateOne(query, blog, function(err){
			// Error in updating blog
			if(err) {
				console.log(err);
				return;
			} else {
				req.flash('success', 'Blog updated successfully');
				res.redirect('/catalog/blog/' + query._id);
			}
		});

	}

]


// Delete blog
exports.blog_delete = function (req, res) {

	// Send an error if user not logged in
	if(!req.user._id) {
		res.status(500).send();
	}

	var query = {_id: req.params.id};

	Blog.findById(req.params.id)
		.populate('author')
		.exec(function (err, blog_model) {
			if (err) {return next(err);}
			// Send error if user is logged in, but didn't create the blog
			if(blog_model.author.id != req.user._id)  {
				res.status(500).send();
			} else {
				// Blog was created by the user, so continue with delete
				Blog.remove(query, function (err) {
					if(err) {return next(err)};
					req.flash('success', 'Blog deleted successfully');
					res.send('Success');
				})
			}
	});

}
