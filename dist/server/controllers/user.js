"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _bcrypt = _interopRequireDefault(require("bcrypt"));

var _lodash = require("lodash");

var _cloudinary = _interopRequireDefault(require("cloudinary"));

var _httpStatus = _interopRequireDefault(require("http-status"));

var _formidable = _interopRequireDefault(require("formidable"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _appConfig = _interopRequireDefault(require("../models/appConfig"));

var _env = _interopRequireDefault(require("../../config/env"));

var _emailApi = _interopRequireDefault(require("../service/emailApi"));

var _notification = _interopRequireDefault(require("./notification"));

var _serverConfig = _interopRequireDefault(require("../models/serverConfig"));

var _user = _interopRequireDefault(require("../models/user"));

var _uuid = _interopRequireDefault(require("uuid"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var uuidv5 = require("uuid");
/**
 * Get user
 * @returns {User}
 */


function get(req, res) {
  return res.send({
    success: true,
    message: "user found",
    data: req.user
  });
}
/**
 * Get getCloudinaryDetails
 * @returns {getCloudinaryDetails}

 */


function getCloudinaryDetails() {
  return new Promise(function (resolve, reject) {
    _serverConfig["default"].findOneAsync({
      key: "cloudinaryConfig"
    }).then(function (foundDetails) {
      resolve(foundDetails.value);
    })["catch"](function (err) {
      reject(err);
    });
  });
}
/**
 * Get appConfig
 * @returns {appConfig}
 */


function getConfig() {
  return new Promise(function (resolve, reject) {
    _appConfig["default"].findOneAsync({
      key: "sendConfig"
    }).then(function (foundDetails) {
      resolve(foundDetails.value);
    })["catch"](function (err) {
      reject(err);
    });
  });
}

function getApproveConfig() {
  return new Promise(function (resolve, reject) {
    _appConfig["default"].findOneAsync({
      key: "approveConfig"
    }).then(function (foundDetails) {
      resolve(foundDetails.value);
    })["catch"](function (err) {
      reject(err);
    });
  });
}
/**
 * Create new user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
// { email: req.body.email, phoneNo: req.body.phoneNo }


function create(req, res, next) {
  console.log("User Register");

  _user["default"].findOneAsync({
    $or: [{
      $and: [{
        email: req.body.email
      }, {
        phoneNo: req.body.phoneNo
      }]
    }, {
      $or: [{
        email: req.body.email
      }, {
        phoneNo: req.body.phoneNo
      }]
    }]
  }).then(function (foundUser) {
    console.log(foundUser, "@@@@@@@@@@@@@@@@@@@######################");

    if (foundUser !== null && foundUser.userType === req.body.userType) {
      _user["default"].findOneAndUpdateAsync({
        _id: foundUser._id
      }, {
        $set: {
          loginStatus: true
        }
      }, {
        "new": true
      }) //eslint-disable-line
      // eslint-disable-next-line
      .then(function (updateUserObj) {
        if (updateUserObj) {
          console.log(updateUserObj, "userObj");

          var jwtAccessToken = _jsonwebtoken["default"].sign(updateUserObj.toJSON(), _env["default"].jwtSecret);

          var returnObj = {
            success: true,
            message: "",
            data: {}
          };
          console.log(returnObj, "after jwtAccessToken");
          returnObj.data.jwtAccessToken = "JWT ".concat(jwtAccessToken);
          returnObj.data.user = updateUserObj;
          returnObj.message = "user already exist";
          returnObj.success = false;
          return res.send(returnObj);
        }
      }).error(function (e) {
        var err = new _APIError["default"]("error in updating user details while login ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
        next(err);
      });
    } else {
      getApproveConfig().then(function (values) {
        var optValue = Math.floor(100000 + Math.random() * 900000);
        var user = new _user["default"]({
          email: req.body.email,
          password: req.body.password,
          userType: req.body.userType,
          fname: req.body.fname,
          lname: req.body.lname,
          userName: String(req.body.userName).toLowerCase() || (0, _uuid["default"])(),
          phoneNo: req.body.phoneNo,
          gpsLoc: [req.body.lat, req.body.lon],
          carDetails: req.body.userType === "driver" ? {
            type: "sedan"
          } : {},
          mapCoordinates: [0, 0],
          // isApproved:
          //   req.body.userType, 
          //   === "driver"
          //     ? values.autoApproveDriver
          //     : values.autoApproveRider,
          loginStatus: true,
          otp: optValue
        });
        user.saveAsync().then(function (savedUser) {
          console.log(savedUser, "savedUserObj");
          var returnObj = {
            success: true,
            message: "",
            data: {}
          };

          var jwtAccessToken = _jsonwebtoken["default"].sign(savedUser.toJSON(), _env["default"].jwtSecret);

          returnObj.data.jwtAccessToken = "JWT ".concat(jwtAccessToken);
          returnObj.data.user = savedUser;
          returnObj.message = "user created successfully";
          console.log(returnObj, "check userCreated");
          res.send(returnObj);
          getConfig().then(function (data) {
            // get new object to add in    host=req.get('host');
            // link="http://"+req.get('host')+"/verify/email?check="+saveduser.otp "&email=" +savedUser.email;
            if (data.sms.otpVerify) {// sendSms(savedUser._id, `Your OTP is ->` + optValue); //eslint-disable-line
            }

            if (data.email.emailVerify) {// sendEmail(savedUser._id, savedUser, "emailVerify"); //eslint-disable-line
            }

            if (data.email.onRegistrationRider && savedUser.userType === "rider") {// sendEmail(savedUser._id, savedUser, "register"); //eslint-disable-line
            }

            if (data.email.onRegistrationDriver && savedUser.userType === "driver") {// sendEmail(savedUser._id, savedUser, "register"); //eslint-disable-line
            }
          });
        }).error(function (e) {
          return next(e);
        });
      });
    }
  });
}
/**
 * Update existing user
 * @property {Object} req.body.user - user object containing all fields.
 * @returns {User}
 */


function update(req, res, next) {
  var user = req.user;
  user.fname = req.body.fname ? req.body.fname : user.fname;
  user.lname = req.body.lname ? req.body.lname : user.lname;
  user.email = req.body.email ? req.body.email : user.email;
  user.phoneNo = req.body.phoneNo ? req.body.phoneNo : user.phoneNo;
  user.deviceId = req.body.deviceId ? req.body.deviceId : user.deviceId;
  user.pushToken = req.body.pushToken ? req.body.pushToken : user.deviceId;
  user.tokenId = req.body.tokenId ? req.body.tokenId : user.tokenId;
  user.emergencyDetails = req.body.emergencyDetails ? req.body.emergencyDetails : user.emergencyDetails;
  user.homeAddress = req.body.homeAddress ? req.body.homeAddress : user.homeAddress;
  user.workAddress = req.body.workAddress ? req.body.workAddress : user.workAddress;
  user.carDetails = req.body.carDetails ? req.body.carDetails : user.carDetails;
  user.licenceDetails = req.body.licenceDetails ? req.body.licenceDetails : user.licenceDetails;
  user.bankDetails = req.body.bankDetails ? req.body.bankDetails : user.bankDetails;
  user.isAvailable = req.body.isAvailable;
  user.saveAsync().then(function (savedUser) {
    var returnObj = {
      success: true,
      message: "user details updated successfully",
      data: savedUser
    };
    res.send(returnObj);
  }).error(function (e) {
    return next(e);
  });
}
/**
 * function  to upload pic
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */


function upload(req, res, next) {
  getCloudinaryDetails().then(function (value) {
    if (value) {
      _cloudinary["default"].config({
        cloud_name: value.cloud_name,
        api_key: value.api_key,
        api_secret: value.api_secret
      });

      var form = new _formidable["default"].IncomingForm();
      form.on("error", function (err) {
        console.error(err, "error heree"); //eslint-disable-line
      });
      form.parse(req, function (err, fields, files) {
        console.log(files, "parse image");
        var imgpath = files.image;

        _cloudinary["default"].v2.uploader.upload(imgpath.path, function (error, results) {
          if (error) {
            console.log(error, "error upload");
          }

          if (results) {
            var user = req.user;

            if (req.headers.updatetype === "profile") {
              user.profileUrl = results.url;

              _user["default"].findOneAndUpdateAsync({
                _id: user._id
              }, //eslint-disable-line
              {
                $set: {
                  profileUrl: results.url
                }
              }, {
                "new": true
              }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: "user pic updated successfully",
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }

            if (req.headers.updatetype === "licence") {
              user.profileUrl = results.url;

              _user["default"].findOneAndUpdateAsync({
                _id: user._id
              }, //eslint-disable-line
              {
                $set: {
                  licenceUrl: results.url
                }
              }, {
                "new": true
              }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: "user licenceDetails updated successfully",
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }

            if (req.headers.updatetype === "permit") {
              user.profileUrl = results.url;

              _user["default"].findOneAndUpdateAsync({
                _id: user._id
              }, //eslint-disable-line
              {
                $set: {
                  vechilePaperUrl: results.url
                }
              }, {
                "new": true
              }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: "user vechilePaperUrl updated successfully",
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }

            if (req.headers.updatetype === "insurance") {
              user.profileUrl = results.url;

              _user["default"].findOneAndUpdateAsync({
                _id: user._id
              }, //eslint-disable-line
              {
                $set: {
                  insuranceUrl: results.url
                }
              }, {
                "new": true
              }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: "user insuranceUrl updated successfully",
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }

            if (req.headers.updatetype === "registration") {
              user.profileUrl = results.url;

              _user["default"].findOneAndUpdateAsync({
                _id: user._id
              }, //eslint-disable-line
              {
                $set: {
                  rcBookUrl: results.url
                }
              }, {
                "new": true
              }).then(function (savedUser) {
                var returnObj = {
                  success: true,
                  message: "user rcBookUrl updated successfully",
                  data: savedUser
                };
                res.send(returnObj);
              }).error(function (e) {
                return next(e);
              });
            }
          }
        });
      });
    } else {
      var returnObj = {
        success: false,
        message: "Problem in updating",
        data: req.user
      };
      res.send(returnObj);
    }
  });
}
/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
// function list(req, res, next) {
//   const { limit = 50, skip = 0 } = req.query;
//   User.list({ limit, skip }).then((users) => res.json(users))
//     .error((e) => next(e));
// }

/**
 * Delete user.
 * @returns {User}
 */


function remove(req, res, next) {
  var user = req.user;
  user.removeAsync().then(function (deletedUser) {
    var returnObj = {
      success: true,
      message: "user deleted successfully",
      data: deletedUser
    };
    res.send(returnObj);
  }).error(function (e) {
    return next(e);
  });
}
/**
 * Load user and append to req.
 */


function load(req, res, next, id) {
  _user["default"].get(id).then(function (user) {
    req.user = user; // eslint-disable-line no-param-reassign

    return next();
  }).error(function (e) {
    return next(e);
  });
}

function hashed(password) {
  return new Promise(function (resolve, reject) {
    _bcrypt["default"].genSalt(10, function (err, salt) {
      if (err) {
        reject(err);
      }

      _bcrypt["default"].hash(password, salt, function (hashErr, hash) {
        if (hashErr) {
          reject(hashErr);
        }

        console.log(hash); //eslint-disable-line

        resolve(hash);
      });
    });
  });
}

function forgotPassword(req, res, next) {
  _user["default"].findOneAsync({
    email: req.body.email
  }) // eslint-disable-next-line
  .then(function (foundUser) {
    //eslint-disable-line
    if (foundUser) {
      var newPassword = Math.random().toString(36).substr(2, 6);
      hashed(newPassword).then(function (result) {
        var hashPassword = result;

        _user["default"].findOneAndUpdateAsync({
          _id: foundUser._id
        }, {
          $set: {
            password: hashPassword
          }
        }) //eslint-disable-line
        // eslint-disable-next-line
        .then(function (updateUserObj) {
          //eslint-disable-line
          if (updateUserObj) {
            getConfig().then(function (data) {
              if (data.email.onForgotPassword) {
                var userObj = Object.assign(updateUserObj, {
                  newpass: newPassword
                });
                (0, _emailApi["default"])(updateUserObj._id, userObj, "forgot"); //eslint-disable-line
              }
            });

            var jwtAccessToken = _jsonwebtoken["default"].sign(updateUserObj.toJSON(), _env["default"].jwtSecret);

            var returnObj = {
              success: true,
              message: "",
              data: {}
            };
            returnObj.data.jwtAccessToken = "JWT ".concat(jwtAccessToken);
            returnObj.data.user = updateUserObj;
            returnObj.message = "Check your Email Please";
            returnObj.success = true;
            return res.send(returnObj);
          }
        }).error(function (e) {
          var err = new _APIError["default"]("error in updating user details while login ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          return res.send(err);
        });
      });
    } else {
      var returnObj = {
        success: true,
        message: "",
        data: {}
      };
      returnObj.message = "No user exist with this email";
      returnObj.success = false;
      return res.send(returnObj);
    }
  }).error(function (e) {
    return next(e);
  });
}

function addFollowing(req, res, next) {
  if (req.user.followings && req.user.followings.indexOf(req.body.followingId) > 0) {
    return res.send({
      success: false,
      data: "Provided User already being Followed"
    });
  }

  var notificationData = {
    userId: req.body.followingId,
    type: 'followed',
    link: req.user._id,
    toDisplayUser: req.user._id,
    date: Date.now()
  };

  _user["default"].findOneAndUpdate({
    _id: req.user._id
  }, {
    $push: {
      followings: req.body.followingId
    }
  }).then(function (user) {
    _user["default"].findOneAndUpdate({
      _id: req.body.followingId
    }, {
      $push: {
        followers: user._id
      }
    }).then(function (result) {
      _notification["default"].createNotification('followed', notificationData);

      return res.send({
        success: true,
        message: "User Followed Successfully",
        data: {}
      });
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      data: err
    });
  });
}

function removeFollowing(req, res, next) {
  if (req.user.followings && req.user.followings.indexOf(req.body.followingId) < 0) {
    return res.send({
      success: false,
      data: "Provided User is not being Followed"
    });
  }

  _user["default"].findOneAndUpdate({
    _id: req.user._id
  }, {
    $pull: {
      followings: req.body.followingId
    }
  }, {
    multi: true
  }).then(function (user) {
    _user["default"].findOneAndUpdate({
      _id: req.body.followingId
    }, {
      $pull: {
        followers: req.user._id
      }
    }, {
      multi: true
    }).then(function (result) {
      return res.send({
        success: true,
        message: "User Unfollowed",
        data: {}
      });
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      message: "Failed To Unfollow User",
      data: err
    });
  });
}

function removeFollower(req, res, next) {
  if (req.user.followers && req.user.followers.indexOf(req.body.followerId) < 0) {
    return res.send({
      success: false,
      data: "Provided User is not your Follower"
    });
  }

  _user["default"].findOneAndUpdate({
    _id: req.user._id
  }, {
    $pull: {
      followers: req.body.followerId
    }
  }, {
    multi: true
  }).then(function (result) {
    return res.send({
      success: true,
      message: "User no longer your follower",
      data: {}
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      message: "Failed To remove follower",
      data: err
    });
  });
}

function fetchMyProfileUsers(req, res, next) {
  req.id = req.user._id;
  return next();
}

function fetchPersonUsers(req, res, next) {
  req.id = req.params.id;
  return next();
}

function fetchFollowingsOrFollowers(req, res, next) {
  var type = (0, _lodash.get)(req.query, "query", "");
  var searchString = (0, _lodash.get)(req.query, "name");
  var pageNo = parseInt((0, _lodash.get)(req.query, "pageNo", 1));
  var limit = parseInt((0, _lodash.get)(req.query, "limit", 10));
  var skip = (pageNo - 1) * limit;
  var searchQuery = {
    "$regex": searchString,
    "$options": "i"
  };
  var cond = {};

  if (searchString) {
    cond = _objectSpread({}, cond, {}, {
      $or: [{
        'fname': searchQuery
      }, {
        'lname': searchQuery
      }, {
        'userName': searchQuery
      }]
    });
  }

  _user["default"].find({
    _id: req.id
  }).populate(type, "fname lname userName profileUrl followers followings", cond).select("fname lname").then(function (user) {
    var result = (0, _lodash.get)(user[0], type, []).slice(skip, skip + limit);
    var pages = result.length < limit ? 1 : Math.ceil(result.length / limit);
    var totalCount = result.length;
    var obj = [_defineProperty({
      fname: (0, _lodash.get)(user[0], 'fname'),
      lname: (0, _lodash.get)(user[0], 'lname')
    }, type, result)];
    return res.send({
      success: true,
      message: "List of ".concat(type),
      data: {
        totalCount: totalCount,
        pages: pages,
        result: obj
      }
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      message: "Failed To Fetch ".concat(type),
      data: err
    });
  });
}

function searchUser(req, res, next) {
  var searchString = (0, _lodash.get)(req.query, "q", "");
  var type = (0, _lodash.get)(req.query, "userType");
  var pageNo = parseInt((0, _lodash.get)(req.query, "pageNo", 1));
  var limit = parseInt((0, _lodash.get)(req.query, "limit", 10));
  var skip = (pageNo - 1) * limit;
  var searchQuery = {
    "$regex": searchString,
    "$options": "i"
  };
  var condition = [{
    $or: [{
      'fname': searchQuery
    }, {
      'lname': searchQuery
    }, {
      'userName': searchQuery
    }]
  }, {
    userType: {
      $nin: ['admin', 'superAdmin']
    },
    _id: {
      $nin: [req.user._id]
    }
  }];

  if (type) {
    condition = [].concat(_toConsumableArray(condition), [{
      userType: type
    }]);
  }

  _user["default"].find({
    $and: condition
  }, null, {
    skip: skip,
    limit: limit
  }).select('fname lname userName followers followings profileUrl').then(function (user) {
    if (!user.length) {
      return res.send({
        success: false,
        message: 'Users Not Found',
        data: user
      });
    }

    return res.send({
      success: true,
      message: "Found Users",
      data: user
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      message: "Failed To Search User",
      data: err
    });
  });
}

function getUserDetails(req, res, next) {
  var id = req.params.id;

  _user["default"].findOne({
    _id: id
  }).select('fname lname userName followers followings profileUrl').then(function (user) {
    if (!user) {
      return res.send({
        success: false,
        message: 'User Not Found',
        data: user
      });
    }

    return res.send({
      success: true,
      message: "Found User",
      data: user
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      message: "Failed To Fetch User",
      data: err
    });
  });
}

var _default = {
  load: load,
  get: get,
  create: create,
  update: update,
  remove: remove,
  forgotPassword: forgotPassword,
  upload: upload,
  addFollowing: addFollowing,
  removeFollowing: removeFollowing,
  removeFollower: removeFollower,
  fetchFollowingsOrFollowers: fetchFollowingsOrFollowers,
  fetchMyProfileUsers: fetchMyProfileUsers,
  fetchPersonUsers: fetchPersonUsers,
  searchUser: searchUser,
  getUserDetails: getUserDetails
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=user.js.map
