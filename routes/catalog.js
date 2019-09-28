var express = require('express');
var router = express.Router();


// Require controller modules
var blog_controller = require('../controllers/blogController');


// Access control. Only logged in users can modify their blogs
function isLoggedin(req, res, next) {
	if(req.isAuthenticated()) {
		// All good. There is a logged in user
		return next();
	} else {
		// No user logged in. Redirect to the login page
		req.flash('danger', 'Please login');
		res.redirect('/users/login');
	}
}


/// BLOG ROUTES ///

// GET home page
router.get('/', blog_controller.index);

// GET list of all blogs
router.get('/blogs/:page?', blog_controller.blog_list_get);

// GET request for creating a Blog. NOTE This must come before routes that display Blog (uses id)
router.get('/blog/create', isLoggedin, blog_controller.blog_create_get);
// POST request for creating Blog
router.post('/blog/create', blog_controller.blog_create_post);

// GET request to update Blog.
router.get('/blog/:id/update', isLoggedin, blog_controller.blog_update_get);
// POST request to update Blog.
router.post('/blog/:id/update', blog_controller.blog_update_post);

// GET request for one Blog.
router.get('/blog/:id', blog_controller.blog_detail);

// DELETE blog
router.delete('/blog/:id', blog_controller.blog_delete);


module.exports = router;
