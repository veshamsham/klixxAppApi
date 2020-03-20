"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

var _user = _interopRequireDefault(require("../models/user"));

var _uuid = _interopRequireDefault(require("uuid"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var debug = require("debug")("Taxi-app-backend-web-dashboard: admin-user");

function getAllUsers(req, res, next) {
  var limit = req.query.limit ? req.query.limit : _env["default"].limit;
  var pageNo = req.query.pageNo;
  var skip = pageNo ? (pageNo - 1) * limit : _env["default"].skip;
  var userType = req.query.userType;
  debug("skip value: ".concat(req.query.pageNo));

  _user["default"].countAsync({
    userType: userType
  }).then(function (totalUserRecord) {
    //eslint-disable-line
    var returnObj = {
      success: true,
      message: "no of ".concat(userType, "s are zero"),
      // `no of active drivers are ${returnObj.data.length}`;
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalUserRecord / limit),
        limit: limit,
        currPageNo: pageNo,
        currNoOfRecord: 20
      }
    };

    if (totalUserRecord < 1) {
      return res.send(returnObj);
    }

    if (skip > totalUserRecord) {
      var err = new _APIError["default"]("Request Page does not exists", _httpStatus["default"].NOT_FOUND);
      return next(err);
    }

    _user["default"].find({
      userType: userType
    }).limit(limit).skip(skip).then(function (userData) {
      returnObj.data = transformReturnObj(userData);
      returnObj.message = "".concat(userType, "s found");
      returnObj.meta.currNoOfRecord = returnObj.data.length;
      debug("no of records are ".concat(returnObj.meta.currNoOfRecord));
      return res.send(returnObj);
    })["catch"](function (err) {
      res.send("Error", err);
    });
  }).error(function (e) {
    var err = new _APIError["default"]("error occured while counting the no of users ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    debug("error inside getAllUsers records");
    next(err);
  });
}

function getTotalUsers(req, res) {
  // new users list
  _user["default"].find().then(function (foundUser) {
    res.send(foundUser);
  })["catch"](function (err) {
    res.send("Error", err);
  });
}

function getApprovePendingUsers(req, res, next) {
  var userType = req.query.userType;

  _user["default"].find({
    $and: [{
      userType: userType
    }, {
      isApproved: "false"
    }]
  }).then(function (foundPendingUsers) {
    var returnObj = {
      success: false,
      message: "no of pending ".concat(userType, "s are zero"),
      data: null,
      meta: {
        totalRecords: 0
      }
    };
    returnObj.data = foundPendingUsers;

    if (returnObj.data.length > 0) {
      returnObj.success = true;
      returnObj.message = "no of pending users are ".concat(returnObj.data.length);
      returnObj.meta.totalRecords = "".concat(returnObj.data.length);
      res.send(returnObj);
    } else {
      res.send(returnObj);
    }
  })["catch"](function (err) {
    next(err);
  });
}

function approveUser(req, res, next) {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
  var id = req.query.id;

  _user["default"].findOneAndUpdateAsync({
    _id: id
  }, {
    $set: {
      isApproved: true
    }
  }).then(function (userUpdateData) {
    var returnObj = {
      success: false,
      message: "unable to update  user , user id provided didnt match ",
      data: null
    };
    returnObj.data = userUpdateData;
    console.log(returnObj, ">>>>>>>>>>>RETURNOBJECT<<<<<<<<<<<<<");

    if (returnObj.data) {
      returnObj.success = "true";
      returnObj.message = "user updated";
      res.send(returnObj);
    }
  })["catch"](function (err) {
    console.log(err, '37645834658346583475634853648573');
    next(err);
  });
}

function rejectUser(req, res, next) {
  // findOneAndRemove
  var id = req.query.id;

  _user["default"].findOneAndRemoveAsync({
    _id: id
  }).then(function (rejectUserData) {
    var returnObj = {
      success: false,
      message: "unable to delete  user , user id provided didnt match ",
      data: null
    };
    returnObj.data = rejectUserData;

    if (returnObj.data) {
      returnObj.success = "true";
      returnObj.message = "user deleted";
      res.send(returnObj);
    }
  })["catch"](function (err) {
    next(err);
  });
}

function getActiveDriverDetails(req, res, next) {
  _user["default"].find({
    $and: [{
      userType: "driver"
    }, {
      loginStatus: "true"
    }, {
      isAvailable: "true"
    }]
  }).then(function (foundActiveDrivers) {
    var returnObj = {
      success: false,
      message: "no of active drivers are zero",
      data: null,
      meta: {
        totalRecords: 0
      }
    };
    returnObj.data = foundActiveDrivers;

    if (returnObj.data.length > 0) {
      returnObj.success = "true";
      returnObj.message = "no of active drivers are ".concat(returnObj.data.length);
      returnObj.meta.totalRecords = "".concat(returnObj.data.length);
      res.send(returnObj);
    } else {
      returnObj.success = "false";
      returnObj.message = "no of active drivers are ".concat(returnObj.data.length);
      returnObj.meta.totalRecords = "".concat(returnObj.data.length);
      res.send(returnObj);
    }
  })["catch"](function (err) {
    next(err);
  });
}

function getActiveCustomerDetails(req, res, next) {
  _user["default"].find({
    $and: [{
      userType: "rider"
    }, {
      loginStatus: "true"
    }]
  }).then(function (foundActiveCustomers) {
    var returnObj = {
      success: false,
      message: "no of active customers are zero",
      data: null,
      meta: {
        totalRecords: 0
      }
    };
    returnObj.data = foundActiveCustomers;

    if (returnObj.data.length > 0) {
      returnObj.success = "true";
      returnObj.message = "no of active customers are ".concat(returnObj.data.length);
      returnObj.meta.totalRecords = "".concat(returnObj.data.length);
      res.send(returnObj);
    }
  })["catch"](function (err) {
    next(err);
  });
}

function getUsersDetails(req, res, next) {
  var userId = req.params.userId;
  var returnObj = {
    success: false,
    message: "user Id is not defined",
    data: null
  };

  if (userId) {
    _user["default"].findByIdAsync(userId).then(function (userData) {
      if (userData) {
        returnObj.success = true;
        returnObj.message = "user found and its corresponding details";
        returnObj.data = userData;
      } else {
        returnObj.success = false;
        returnObj.message = "user not found with the given id";
        returnObj.data = null;
      }

      res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError["default"]("Error occured while findind the user details ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      next(err);
    });
  } else {
    res.send(returnObj);
  }
}

function updateUserDetails(req, res, next) {
  var userId = req.body._id; //eslint-disable-line

  var updateUserObj = Object.assign({}, req.body);

  _user["default"].findOneAsync({
    _id: userId
  }).then(function (userDoc) {
    if (userDoc) {
      userDoc.fname = updateUserObj.fname ? updateUserObj.fname : userDoc.fname;
      userDoc.lname = updateUserObj.lname ? updateUserObj.lname : userDoc.lname;
      userDoc.phoneNo = updateUserObj.phoneNo ? updateUserObj.phoneNo : userDoc.phoneNo;
      userDoc.address = updateUserObj.address ? updateUserObj.address : userDoc.address;
      userDoc.city = updateUserObj.city ? updateUserObj.city : userDoc.city;
      userDoc.state = updateUserObj.state ? updateUserObj.state : userDoc.state;
      userDoc.country = updateUserObj.country ? updateUserObj.country : userDoc.country;
      var returnObj = {
        success: false,
        message: "unable to find the object",
        data: null,
        meta: null
      };
      userDoc.saveAsync().then(function (savedDoc) {
        if (savedDoc.password) {
          debug("inside password delete function");
          savedDoc = savedDoc.toObject();
          delete savedDoc.password;
        }

        returnObj.success = true;
        returnObj.message = "user document saved";
        returnObj.data = savedDoc;
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError["default"]("Error occured while updating the user details ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
        next(err);
      });
    }
  }).error(function (e) {
    var err = new _APIError["default"]("Error occured while searching for the user ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function userStats(req, res, next) {
  var returnObj = {
    success: false,
    message: "no data available",
    data: null
  };

  _user["default"].aggregateAsync([{
    $match: {
      $or: [{
        userType: "driver"
      }, {
        userType: "rider"
      }]
    }
  }, {
    $group: {
      _id: "riderDriverRatio",
      rider: {
        $sum: {
          $cond: [{
            $eq: ["$userType", "rider"]
          }, 1, 0]
        }
      },
      driver: {
        $sum: {
          $cond: [{
            $eq: ["$userType", "driver"]
          }, 1, 0]
        }
      },
      totalUser: {
        $sum: 1
      }
    }
  }]).then(function (userStatsData) {
    returnObj.success = true;
    returnObj.message = "user chart data";
    returnObj.data = userStatsData;
    return res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError["default"]("Error occurred while computing statistic for user ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
} // this function removes carDetails from the rider object and for driver object add car details a object


function transformReturnObj(userData) {
  for (var i = 0; i < userData.length; i++) {
    //eslint-disable-line
    if (userData[i].userType === "rider" && userData[i].carDetails) {
      delete userData[i].carDetails;
    }
  }

  return userData;
}

function changePassword(req, res, next) {
  var userObj = {
    email: req.body.email,
    userType: req.body.userType
  };

  _user["default"].findOneAsync(userObj, "+password").then(function (user) {
    //eslint-disable-line
    var returnObj = {
      success: false,
      message: "",
      data: null
    };

    if (!user) {
      var err = new _APIError["default"]("User not found with the given email id", _httpStatus["default"].NOT_FOUND);
      return next(err);
    } else {
      user.comparePassword(req.body.oldpassword, function (passwordError, isMatch) {
        //eslint-disable-line
        if (passwordError || !isMatch) {
          var _err = new _APIError["default"]("Incorrect old password", _httpStatus["default"].UNAUTHORIZED);

          return next(_err);
        }

        user.password = req.body.password;
        user.saveAsync().then(function (savedUser) {
          returnObj.success = true;
          returnObj.message = "password changed  successfully";
          returnObj.data = savedUser;
          return res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError["default"]("Error while changing password ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          returnObj.success = false;
          returnObj.message = "password not changed";
          console.log(err);
          return next(returnObj);
        });
      });
    }
  }).error(function (e) {
    var err = new _APIError["default"]("erro while finding user ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function createNewUser(req, res, next) {
  var userData = Object.assign({}, req.body);

  _user["default"].findOneAsync({
    email: userData.email,
    userType: userData.userType
  }).then(function (foundUser) {
    //eslint-disable-line
    var returnObj = {
      success: false,
      message: "",
      data: null
    };

    if (foundUser !== null) {
      var err = new _APIError["default"]("Email Id Already Exist", _httpStatus["default"].CONFLICT);
      return next(err);
    }

    var userObj = new _user["default"]({
      email: userData.email,
      password: userData.password ? userData.password : "abcdefgh",
      userType: userData.userType,
      fname: userData.fname,
      lname: userData.lname,
      dob: userData.dob,
      phoneNo: userData.phoneNo,
      userName: (0, _uuid["default"])(),
      bloodGroup: userData.bloodGroup ? userData.bloodGroup : null,
      gpsLoc: [userData.lat, userData.lon],
      emergencyDetails: userData.userType === "rider" ? {
        phone: userData.emergencyDetails.phone ? userData.emergencyDetails.phone : "",
        name: userData.emergencyDetails.name ? userData.emergencyDetails.name : "",
        imgUrl: null
      } : {
        phone: "",
        name: "",
        imgUrl: null
      },
      carDetails: userData.userType === "driver" ? {
        type: userData.carDetails.type ? userData.carDetails.type : "Sedan",
        company: userData.carDetails.company ? userData.carDetails.company : "Maruti",
        regNo: userData.carDetails.regNo ? userData.carDetails.regNo : "",
        RC_ownerName: userData.carDetails.RC_ownerName ? userData.carDetails.RC_ownerName : "",
        vehicleNo: userData.carDetails.vehicleNo ? userData.carDetails.vehicleNo : "",
        carModel: userData.carDetails.carModel ? userData.carDetails.carModel : "",
        regDate: userData.carDetails.regDate ? userData.carDetails.regDate : ""
      } : {},
      insuranceUrl: userData.userType === "driver" ? userData.vehicleDocuments.insuranceUrl : null,
      rcBookUrl: userData.userType === "driver" ? userData.vehicleDocuments.rcBookUrl : null,
      licenceUrl: userData.userType === "driver" ? userData.licenceDocuments.licenceUrl : null,
      vechilePaperUrl: userData.userType === "driver" ? userData.licenceDocuments.vechilePaperUrl : null,
      licenceDetails: userData.userType === "driver" ? {
        licenceNo: userData.licenceDetails.licenceNo ? userData.licenceDetails.licenceNo : null,
        issueDate: userData.licenceDetails.issueDate ? userData.licenceDetails.issueDate : null,
        expDate: userData.licenceDetails.expDate ? userData.licenceDetails.expDate : null
      } : {},
      bankDetails: userData.userType === "driver" ? {
        accountNo: userData.bankDetails.accountNo ? userData.bankDetails.accountNo : null,
        holderName: userData.bankDetails.holderName ? userData.bankDetails.holderName : "",
        IFSC: userData.bankDetails.IFSC ? userData.bankDetails.IFSC : ""
      } : {},
      mapCoordinates: [0, 0],
      loginStatus: true
    });
    userObj.saveAsync().then(function (savedUser) {
      returnObj.success = true;
      returnObj.message = "user created successfully";
      returnObj.data = savedUser;
      return res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError["default"]("Error while Creating new User ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      returnObj.success = false;
      returnObj.message = "user not created";
      console.log(err);
      return next(returnObj);
    });
  }).error(function (e) {
    var err = new _APIError["default"]("Error while Searching the user ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    return next(err);
  });
}

var _default = {
  rejectUser: rejectUser,
  approveUser: approveUser,
  getApprovePendingUsers: getApprovePendingUsers,
  getAllUsers: getAllUsers,
  getUsersDetails: getUsersDetails,
  updateUserDetails: updateUserDetails,
  userStats: userStats,
  createNewUser: createNewUser,
  getTotalUsers: getTotalUsers,
  getActiveDriverDetails: getActiveDriverDetails,
  getActiveCustomerDetails: getActiveCustomerDetails,
  changePassword: changePassword
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=admin-user.js.map
