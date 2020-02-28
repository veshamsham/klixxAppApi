"use strict";

/* eslint-disable */
// Import async.js - utility library for handlng asynchronous calls
var async = require('async');

var databaseName = 'taxiApp-development';
var nodeEnv = process.env.NODE_ENV;
console.log("nodeEnv--" + nodeEnv);
if (nodeEnv === 'development') databaseName = 'taxiApp-development';
if (nodeEnv === 'production') databaseName = 'taxiApp-api-production';
var databaseURL = "mongodb://localhost:27017/".concat(databaseName);

var mongoose = require('mongoose');

var bcrypt = require('bcrypt-nodejs');

console.log("admin.js---" + databaseURL);
var userSchema = new mongoose.Schema({
  fname: {
    type: String,
    "default": null
  },
  lname: {
    type: String,
    "default": null
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  userType: {
    type: String,
    "default": 'admin'
  }
}); // Mongoose middleware that is called before save to hash the password

userSchema.pre('save', function (next, err) {
  //eslint-disable-line
  var user = this;
  var SALT_FACTOR = 10;
  console.log(err); //eslint-disable-line

  if (!user.isNew) {
    // && !user.isModified('password')
    return next();
  } // Encrypt password before saving to database


  bcrypt.genSalt(SALT_FACTOR, function (error, salt) {
    //eslint-disable-line
    if (error) return next(error);
    bcrypt.hash(user.password, salt, null, function (errors, hash) {
      //eslint-disable-line
      if (errors) return next(errors);
      user.password = hash;
      next();
    });
  });
});
var User = mongoose.model('User', userSchema);
async.series([function (callback) {
  //eslint-disable-line
  mongoose.connect(databaseURL);
  mongoose.connection.on('connected', function () {
    console.log('db connected via mongoose'); //eslint-disable-line

    callback(null, 'SUCCESS - Connected to mongodb');
  });
}, function (callback) {
  var users = [];
  var user = new User({
    fname: 'Rishabh',
    lname: 'Pandey',
    email: 'admin@taxiApp.com',
    password: 'Password',
    userType: 'admin'
  });
  users.push(user);
  console.log('Populating database with %s users', users.length);
  async.eachSeries(users, function (admin, userSavedCallBack) {
    user.save(function (err) {
      if (err) {
        console.dir(err);
      }

      console.log('Saving user #%s', user.name);
      userSavedCallBack();
    });
  }, function (err) {
    if (err) {
      console.dir(err);
    }

    console.log('Finished aysnc.each in seeding db');
    callback(null, 'SUCCESS - Seed database');
  });
}], function (err, results) {
  console.log('\n\n--- Database seed progam completed ---');

  if (err) {
    console.log('Errors = ');
    console.dir(err);
  } else {
    console.log('Results = ');
    console.log(results);
  }

  console.log('\n\n--- Exiting database seed progam ---');
  process.exit(0);
});
//# sourceMappingURL=admin.js.map
