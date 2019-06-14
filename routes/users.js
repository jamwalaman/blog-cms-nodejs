var express = require('express');
var router = express.Router();


// Require controller modules
var user_controller = require('../controllers/userController');


// Access control. Prevent logged in users from going to the register or login page
function isLoggedin(req, res, next) {
	if(req.isAuthenticated()) {
    // Logged in user. Redirect them to the home page
    res.redirect('/');
	} else {
		return next();
	}
}


// GET request for regestring a user
router.get('/register', isLoggedin, user_controller.user_create_get);
// POST request for processing the user registration form
router.post('/register', user_controller.user_create_post);

// GET request for user profile page
router.get('/profile/:id', user_controller.user_detail);

// GET request for user login form
router.get('/login', isLoggedin, user_controller.user_login_get);
// POST request for processing the user llgin form
router.post('/login', user_controller.user_login_post);

// GET request for user logout
router.get('/logout', user_controller.user_logout_get);

module.exports = router;
