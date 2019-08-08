var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema ({
	email: {type: String, lowercase: true, required: true},
  username: {type: String,lowercase: true, required: true},
  password: {type: String, required: true},
}, {timestamps: true});

// Virtual for users URL
UserSchema
.virtual('url')
.get(function() {
	return '/users/profile/' + this._id;
});

// Export model
module.exports = mongoose.model('User', UserSchema);
