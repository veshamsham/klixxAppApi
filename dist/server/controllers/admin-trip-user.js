"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

var _tripRequest = _interopRequireDefault(require("../models/trip-request"));

var _transformReturnObject = require("../service/transform-return-object");

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var debug = require('debug')('Taxi-app-backend-web-dashboard: admin-trip-user');

function userTripDetails(req, res, next) {
  var userId = req.params.userId;
  debug("user id ".concat(userId));
  debug("limit value ".concat(req.query.limit));
  var limit = req.query.limit ? req.query.limit : _env["default"].limit;
  var pageNo = req.query.pageNo ? req.query.pageNo : 1;
  var skip = pageNo ? (pageNo - 1) * limit : _env["default"].skip;

  _user["default"].findByIdAsync(userId).then(function (userObject) {
    //eslint-disable-line
    var returnObj = {
      success: false,
      message: 'user not found with the given id',
      data: [],
      meta: {
        totalNoOfPages: null,
        limit: limit,
        currPageNo: pageNo,
        totalRecords: null
      }
    };

    if (userObject === null || userObject === undefined) {
      return res.send(returnObj);
    }

    var userType = userObject.userType;

    _tripRequest["default"].getUserCount(userType, userId).then(function (totalUserTripRequestRecords) {
      //eslint-disable-line
      returnObj.meta.totalNoOfPages = Math.ceil(totalUserTripRequestRecords / limit);
      returnObj.meta.totalRecords = totalUserTripRequestRecords;

      if (totalUserTripRequestRecords < 1) {
        returnObj.success = true;
        returnObj.message = 'user has zero trip Request records';
        return res.send(returnObj);
      }

      if (skip > totalUserTripRequestRecords) {
        var err = new _APIError["default"]('Request Page No does not exists', _httpStatus["default"].NOT_FOUND);
        return next(err);
      }

      _tripRequest["default"].userList({
        skip: skip,
        limit: limit,
        userId: userId,
        userType: userType
      }).then(function (userTripRequestData) {
        for (var i = 0; i < userTripRequestData.length; i++) {
          //eslint-disable-line
          userTripRequestData[i] = (0, _transformReturnObject.transformReturnObj)(userTripRequestData[i]);
        }

        returnObj.success = true;
        returnObj.message = 'user trip request records';
        returnObj.data = userTripRequestData;
        res.send(returnObj);
      }).error(function (e) {
        var err = new _APIError["default"]("Error occured while fetching user trip Request records ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
        next(err);
      });
    }).error(function (e) {
      var err = new _APIError["default"]("Error occured counting user trip request records ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError["default"]("Error occured searching for user object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function userTripRequestStatics(req, res, next) {
  var userId = req.params.userId;
  debug("user id ".concat(userId));
  debug("limit value ".concat(req.query.limit));
  var limit = req.query.limit ? req.query.limit : _env["default"].limit;
  var pageNo = req.query.pageNo;

  _user["default"].findByIdAsync(userId).then(function (userObject) {
    //eslint-disable-line
    var returnObj = {
      success: false,
      message: 'user not found with the given id',
      data: null,
      meta: {
        totalNoOfPages: null,
        limit: limit,
        currPageNo: pageNo,
        totalRecords: null
      }
    };

    if (userObject === null || userObject === undefined) {
      return res.send(returnObj);
    }

    var userType = userObject.userType;
    var searchObj = {};
    var groupBy = null;

    if (userType === 'rider') {
      searchObj = {};
      groupBy = 'riderId';
      searchObj.riderId = userObject._id; //eslint-disable-line
    }

    if (userType === 'driver') {
      groupBy = 'driverId';
      searchObj = {};
      searchObj.driverId = userObject._id; //eslint-disable-line
    }

    _tripRequest["default"].aggregateAsync([{
      $match: searchObj
    }, {
      $group: {
        _id: "$".concat(groupBy),
        completed: {
          $sum: {
            $cond: [{
              $eq: ['$tripRequestStatus', 'completed']
            }, 1, 0]
          }
        },
        inQueue: {
          $sum: {
            $cond: [{
              $anyElementTrue: {
                $map: {
                  input: ['enRoute', 'arriving', 'arrived', 'request'],
                  as: 'status',
                  "in": {
                    $eq: ['$$status', '$tripRequestStatus']
                  }
                }
              }
            }, 1, 0]
          }
        },
        cancelled: {
          $sum: {
            $cond: [{
              $or: [{
                $eq: ['$tripRequestStatus', 'cancelled']
              }, {
                $eq: ['$tripRequestStatus', 'rejected']
              }]
            }, 1, 0]
          }
        },
        totalRequest: {
          $sum: 1
        }
      }
    }]).then(function (chartStats) {
      returnObj.success = true;
      returnObj.message = 'user trip request statistic';
      returnObj.data = chartStats;
      res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError["default"]("Error occured while grouping the _id ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError["default"]("Error occured searching for user object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

var _default = {
  userTripDetails: userTripDetails,
  userTripRequestStatics: userTripRequestStatics
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=admin-trip-user.js.map
