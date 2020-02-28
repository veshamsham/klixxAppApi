"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Returns jwt token  and user object if valid email and password is provided
 * @param req (email, password, userType)
 * @param res
 * @param next
 * @returns {jwtAccessToken, user}
 */
function testServer(req, res, next) {
  return res.send({
    success: true,
    message: "Server Test Running."
  });
}

function loginadmin(req, res, next) {
  _user["default"].findOneAsync({
    email: req.body.email,
    $or: [{
      userType: "admin"
    }, {
      userType: "superAdmin"
    }]
  }, "+password").then(function (user) {
    //eslint-disable-line
    if (!user) {
      var err = new _APIError["default"]("User not found with the given email id", _httpStatus["default"].NOT_FOUND);
      return next(err);
    } else {
      user.comparePassword(req.body.password, function (passwordError, isMatch) {
        //eslint-disable-line
        if (passwordError || !isMatch) {
          var _err = new _APIError["default"]("Incorrect password", _httpStatus["default"].UNAUTHORIZED);

          return next(_err);
        }

        user.loginStatus = true;
        user.gpsLoc = [77.85368273308545, 12.02172902354515];

        var token = _jsonwebtoken["default"].sign(user.toJSON(), _env["default"].jwtSecret);

        _user["default"].findOneAndUpdateAsync({
          _id: user._id
        }, {
          $set: user
        }, {
          "new": true
        }) //eslint-disable-line
        .then(function (updatedUser) {
          var returnObj = {
            success: true,
            message: "user successfully logged in",
            data: {
              jwtAccessToken: "JWT ".concat(token),
              user: updatedUser
            }
          };
          res.json(returnObj);
        }).error(function (err123) {
          var err = new _APIError["default"]("error in updating user details while login ".concat(err123), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          next(err);
        });
      });
    }
  }).error(function (e) {
    var err = new _APIError["default"]("erro while finding user ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function login(req, res, next) {
  console.log('Auth login');
  var userObj = {
    email: req.body.email,
    userType: req.body.userType
  };

  _user["default"].findOneAsync(userObj, "+password").then(function (user) {
    //eslint-disable-line
    if (!user) {
      var err = new _APIError["default"]("User not found with the given email id", _httpStatus["default"].NOT_FOUND);
      return next(err);
    } else {
      user.comparePassword(req.body.password, function (passwordError, isMatch) {
        //eslint-disable-line
        if (passwordError || !isMatch) {
          var _err2 = new _APIError["default"]("Incorrect password", _httpStatus["default"].UNAUTHORIZED);

          return next(_err2);
        }

        user.loginStatus = true;
        user.gpsLoc = [77.85368273308545, 12.02172902354515];

        var token = _jsonwebtoken["default"].sign(user.toJSON(), _env["default"].jwtSecret);

        _user["default"].findOneAndUpdateAsync({
          _id: user._id
        }, {
          $set: user
        }, {
          "new": true
        }) //eslint-disable-line
        .then(function (updatedUser) {
          var returnObj = {
            success: true,
            message: "user successfully logged in",
            data: {
              jwtAccessToken: "JWT ".concat(token),
              user: updatedUser
            }
          };
          res.json(returnObj);
        }).error(function (err123) {
          var err = new _APIError["default"]("error in updating user details while login ".concat(err123), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          next(err);
        });
      });
    }
  }).error(function (e) {
    var err = new _APIError["default"]("erro while finding user ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}
/** This is a protected route. Change login status to false and send success message.
 * @param req
 * @param res
 * @param next
 * @returns success message
 */


function logout(req, res, next) {
  var userObj = req.user;

  if (userObj === undefined || userObj === null) {
    console.log("user obj is null or undefined inside logout function"); //eslint-disable-line
  }

  userObj.loginStatus = false;
  userObj.isAvailable = false;

  _user["default"].findOneAndUpdate({
    _id: userObj._id,
    loginStatus: true
  }, {
    $set: userObj
  }, {
    "new": true
  }, function (err, userDoc) {
    //eslint-disable-line
    if (err) {
      var error = new _APIError["default"]("error while updateing login status", _httpStatus["default"].INTERNAL_SERVER_ERROR);
      next(error);
    }

    if (userDoc) {
      var returnObj = {
        success: true,
        message: "user logout successfully"
      };
      res.json(returnObj);
    } else {
      var _error = new _APIError["default"]("user not found", _httpStatus["default"].NOT_FOUND);

      next(_error);
    }
  });
} // { $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }] }


function checkUser(req, res) {
  _user["default"].findOneAsync({
    email: req.body.email
  }).then(function (foundUser) {
    if (foundUser !== null) {
      var jwtAccessToken = _jsonwebtoken["default"].sign(foundUser.toJSON(), _env["default"].jwtSecret);

      var returnObj = {
        success: true,
        message: "User Exist",
        data: {}
      };
      returnObj.data = {
        user: foundUser,
        jwtAccessToken: "JWT ".concat(jwtAccessToken)
      };
      return res.send(returnObj);
    } else {
      var _returnObj = {
        success: true,
        message: "New User"
      };
      return res.send(_returnObj);
    }
  })["catch"](function (error) {
    console.log(error); //eslint-disable-line
  });
}

var _default = {
  login: login,
  logout: logout,
  checkUser: checkUser,
  loginadmin: loginadmin,
  testServer: testServer
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=auth.js.map
