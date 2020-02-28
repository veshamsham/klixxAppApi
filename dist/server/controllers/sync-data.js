"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _transformResponse = require("../service/transform-response");

var _trip = _interopRequireDefault(require("../models/trip"));

var _tripRequest = _interopRequireDefault(require("../models/trip-request"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */
function getSyncData(req, res, next) {
  // const userID = req.user._id;
  var currTripId = req.user.currTripId;
  var currTripState = req.user.currTripState;
  var returnObj = {
    success: true,
    message: 'user is not in any trip or tripRequest',
    data: {
      tripRequest: null,
      trip: null
    }
  };

  if (currTripId === null || currTripId === undefined || currTripState === null || currTripState === undefined) {
    res.send(returnObj);
  }

  if (currTripState === 'tripRequest') {
    _tripRequest["default"].findOneAsync({
      $and: [{
        _id: currTripId
      }, {
        $or: [{
          tripRequestStatus: 'enRoute'
        }, {
          tripRequestStatus: 'arriving'
        }, {
          tripRequestStatus: 'arrived'
        }]
      }]
    }).then(function (tripRequestObj) {
      if (tripRequestObj) {
        (0, _transformResponse.fetchReturnObj)(tripRequestObj).then(function (transformedTripRequestObj) {
          returnObj.message = 'user is in tripRequest state';
          returnObj.data.tripRequest = transformedTripRequestObj;
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError["default"]("error occurred when transforming tripRequestObj ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          return next(err);
        });
      } else {
        returnObj.message = 'no trip request object found for the current tripRequest state for the corresponding user';
        res.send(returnObj);
      }
    }).error(function (e) {
      var err = new _APIError["default"]("error occurred when feteching user data from tripRequest schema ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      return next(err);
    });
  }

  if (currTripState === 'trip') {
    _trip["default"].findOneAsync({
      $and: [{
        _id: currTripId
      }, {
        tripStatus: 'onTrip'
      }]
    }).then(function (tripObj) {
      if (tripObj) {
        (0, _transformResponse.fetchReturnObj)(tripObj).then(function (transformedTripObj) {
          returnObj.message = 'user is in trip state';
          returnObj.data.trip = transformedTripObj;
          returnObj.data.tripRequest = null;
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError["default"]("error occurred when feteching user data from trip schema ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          return next(err);
        });
      } else {
        returnObj.message = 'no trip object found for the current trip state for the corresponding user';
        res.send(returnObj);
      }
    }).error(function (e) {
      var err = new _APIError["default"]("error occurred when feteching user data from trip schema ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      return next(err);
    });
  }
}

var _default = {
  getSyncData: getSyncData
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=sync-data.js.map
