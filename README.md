# blog-cms-nodejs
A blog cms created with Node.js and Express.js

Similar to my [movieslsit project](https://github.com/jamwalaman/movieslist-nodejs "Link to the project"). For this project, I've use Passport.js for authentication.

And just because I wanted to try something a little different, I installed MongoDB locally instead of using MongoDB Atlas.
[Click here](https://docs.mongodb.com/manual/administration/install-community/ "Install MongoDB") to install MonogDB

Assuming Node.js and MongoDB is installed, do the following:
* Make sure MongoDB is running locally
* Type 'npm install' to install all the dependencies. And then type 'npm run start'. Open a browser and type localhost:3000

There are two json files in "users-and-blogs" folder that have some dummy content. Go to this folder in the terminal and type `mongoimport --drop --db blogsite_db_dev --collection users --file users.json`. This will import the users. Password for both users is password. Do the same for blogs
