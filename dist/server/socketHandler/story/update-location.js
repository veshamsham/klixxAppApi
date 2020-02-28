"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _gpsDistance = _interopRequireDefault(require("gps-distance"));

var _env = _interopRequireDefault(require("../../../config/env"));

var _transformResponse = require("../../service/transform-response");

var _pushNotification = _interopRequireDefault(require("../../service/pushNotification"));

var _socketStore = _interopRequireDefault(require("../../service/socket-store.js"));

var _tripRequest = _interopRequireDefault(require("../../models/trip-request"));

var _trip = _interopRequireDefault(require("../../models/trip"));

var _user = _interopRequireDefault(require("../../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

//eslint-disable-line

/**
 * updateLocation handler, handle location update of the rider or driver
 * @param socket object
 * @returns {*}
 */

/* eslint-disable */
function updateLocationHandler(socket) {
  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @param userObj - user whose location has to be updated
   * @returns emit an updateDriverLocation or updateRiderLocation event based on userType.
   */
  socket.on("updateLocation", function (userObj) {
    var userType = userObj.userType;
    var searchObj = {};

    if (userType === "rider") {
      searchObj = {
        riderId: userObj._id
      };
    } else if (userType === "driver") {
      searchObj = {
        driverId: userObj._id
      };
    }

    var userID = userObj._id;

    _user["default"].findOneAndUpdateAsync({
      _id: userID
    }, {
      $set: {
        gpsLoc: userObj.gpsLoc
      }
    }, {
      "new": true
    }).then(function (updatedUser) {
      _socketStore["default"].emitByUserId(userID, "locationUpdated", updatedUser);

      _tripRequest["default"].findOneAsync({
        $and: [searchObj, {
          $or: [{
            tripRequestStatus: "enRoute"
          }, {
            tripRequestStatus: "arriving"
          }, {
            tripRequestStatus: "arrived"
          }]
        }]
      }).then(function (tripRequestObj) {
        if (tripRequestObj) {
          if (userType === "driver") {
            _socketStore["default"].emitByUserId(tripRequestObj.riderId, "updateDriverLocation", updatedUser.gpsLoc);

            _socketStore["default"].emitByUserId("59428b1bb0c3cc0f554fd52a", "getDriverDetails", updatedUser.gpsLoc);

            var driverObj = updatedUser;
            changedTripRequestStatus(driverObj, tripRequestObj);
          } else if (userType === "rider") {
            _socketStore["default"].emitByUserId(tripRequestObj.driverId, "updateRiderLocation", updatedUser.gpsLoc);
          }
        } else {
          _trip["default"].findOneAsync({
            $and: [searchObj, {
              tripStatus: "onTrip"
            }]
          }).then(function (tripObj) {
            if (tripObj) {
              if (userType === "driver") {
                _socketStore["default"].emitByUserId(tripObj.riderId, "updateDriverLocation", updatedUser.gpsLoc);

                _socketStore["default"].emitByUserId("59428b1bb0c3cc0f554fd52a", "getDriverDetails", updatedUser.gpsLoc);
              } else if (userType === "rider") {
                _socketStore["default"].emitByUserId(tripObj.driverId, "updateRiderLocation", updatedUser.gpsLoc);
              }
            } else {// no corresponding rider or driver found to emit the update location
            }
          }).error(function (e) {
            _socketStore["default"].emitByUserId(userID, "socketError", e);
          });
        }
      }).error(function (e) {
        _socketStore["default"].emitByUserId(userID, "socketError", e);
      });
    }).error(function (e) {
      _socketStore["default"].emitByUserId(userID, "socketError", e);
    });
  });
}

function changedTripRequestStatus(driverObj, tripRequestObj) {
  var dist = (0, _gpsDistance["default"])(driverObj.gpsLoc[1], driverObj.gpsLoc[0], tripRequestObj.srcLoc[1], tripRequestObj.srcLoc[0]);
  var newTripRequestStatus = null;
  var currentTripRequestStatus = tripRequestObj.tripRequestStatus;
  dist = dist.toFixed(4) * 1000; // dist in meters

  console.log("gps location driver", driverObj.gpsLoc);
  console.log("distance %%%%%%%%", dist);

  if (dist <= _env["default"].arrivedDistance) {
    newTripRequestStatus = "arrived";
  } else if (dist > _env["default"].arrivedDistance && dist < _env["default"].arrivingDistance) {
    newTripRequestStatus = "arriving";
  } else {
    newTripRequestStatus = "enRoute";
  }

  if (newTripRequestStatus !== currentTripRequestStatus) {
    tripRequestObj.tripRequestStatus = newTripRequestStatus;

    _tripRequest["default"].findOneAndUpdateAsync({
      _id: tripRequestObj._id
    }, {
      $set: tripRequestObj
    }, {
      "new": true
    }).then(function (updatedTripRequestObj) {
      (0, _transformResponse.fetchReturnObj)(updatedTripRequestObj).then(function (updatedTripRequestObj123) {
        if (updatedTripRequestObj123.tripRequestStatus === "arrived") {
          (0, _pushNotification["default"])(updatedTripRequestObj.riderId, "Driver has ".concat(updatedTripRequestObj123.tripRequestStatus));
          (0, _pushNotification["default"])(updatedTripRequestObj.driverId, updatedTripRequestObj123.tripRequestStatus);
        } else {
          (0, _pushNotification["default"])(updatedTripRequestObj.riderId, "Driver is ".concat(updatedTripRequestObj123.tripRequestStatus));
          (0, _pushNotification["default"])(updatedTripRequestObj.driverId, updatedTripRequestObj123.tripRequestStatus);
        }

        _socketStore["default"].emitByUserId(updatedTripRequestObj.riderId, "tripRequestUpdated", updatedTripRequestObj123);

        _socketStore["default"].emitByUserId(updatedTripRequestObj.driverId, "tripRequestUpdated", updatedTripRequestObj123);
      });
    }).error(function (err) {
      _socketStore["default"].emitByUserId(tripRequestObj.riderId, "socketError", {
        message: "error while updating tripRequestStatus based on distance",
        data: err
      });

      _socketStore["default"].emitByUserId(tripRequestObj.driverId, "socketError", {
        message: "error while updating tripRequestStatus based on distance",
        data: err
      });
    });
  }
}

var _default = updateLocationHandler;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=update-location.js.map
