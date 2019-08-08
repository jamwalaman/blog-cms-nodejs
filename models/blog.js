var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BlogSchema = new Schema ({
	title: {type: String, required: true, max: 100},
	content: {type: String, required: true},
	author: {type: Schema.ObjectId, ref: 'User', required: true},
	visible: {type: Boolean, required: true}
}, {timestamps: true});

// Virtual for blog's URL
BlogSchema
.virtual('url')
.get(function() {
	return '/catalog/blog/' + this._id;
});


// Date format when viewing a single blog
BlogSchema
.virtual('date')
.get(function() {

	var format_date = moment(this.createdAt).format('LLLL');

	// 'createdAt' is not equal to 'updatedAt' so the blog's been updated.
	if (this.createdAt.toString() !== this.updatedAt.toString()) {
		var updated = moment(this.updatedAt).toArray();
		format_date += ' (updated ' + moment(updated).fromNow() + ')';
	}
	return typeof format_date;

});

// Export model
module.exports = mongoose.model('Blog', BlogSchema);
