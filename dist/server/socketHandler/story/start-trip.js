"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _moment = _interopRequireDefault(require("moment"));

require("whatwg-fetch");

var _gpsDistance = _interopRequireDefault(require("gps-distance"));

var _socketStore = _interopRequireDefault(require("../../service/socket-store.js"));

var _transformResponse = require("../../service/transform-response");

var _appConfig = _interopRequireDefault(require("../../models/appConfig"));

var _payment = _interopRequireDefault(require("../../controllers/payment"));

var _emailApi = _interopRequireDefault(require("../../service/emailApi"));

var _pushNotification = _interopRequireDefault(require("../../service/pushNotification"));

var _smsApi = _interopRequireDefault(require("../../service/smsApi"));

var _tripRequest = _interopRequireDefault(require("../../models/trip-request"));

var _trip = _interopRequireDefault(require("../../models/trip"));

var _user = _interopRequireDefault(require("../../models/user.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable */
//eslint-disable-line
//eslint-disable-line
//eslint-disable-line

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
/**
 * startTriphandler function create a new trip object which stores the different details related to trip.
 * @param socket object
 * @returns {*}
 */


var startTripHandler = function startTripHandler(socket) {
  /**
   * startTrip event is emitted by driver when trip get started
   * @param tripRequest object
   * @param callback function
   * @return send tripUpdated event to the rider with all the information related to trip
   */
  socket.on("startTrip", function (tripRequestObj, cb) {
    console.log("start trip called in apiserver------------>");
    var riderID = tripRequestObj.riderId;
    var driverID = tripRequestObj.driverId;
    tripRequestObj.tripRequestStatus = "completed";
    var tripObj = new _trip["default"]({
      riderId: tripRequestObj.riderId,
      driverId: tripRequestObj.driverId,
      srcLoc: tripRequestObj.srcLoc,
      destLoc: tripRequestObj.destLoc,
      pickUpAddress: tripRequestObj.pickUpAddress,
      destAddress: tripRequestObj.destAddress,
      paymentMode: tripRequestObj.paymentMode
    });
    tripObj.saveAsync().then(function (savedTrip) {
      tripRequestObj.tripId = savedTrip._id;

      _tripRequest["default"].findOneAndUpdateAsync({
        _id: tripRequestObj._id
      }, {
        $set: tripRequestObj
      }).error(function (e) {
        _socketStore["default"].emitByUserId(riderID, "socketError", e);

        _socketStore["default"].emitByUserId(driverID, "socketError", e);
      });

      _user["default"].updateAsync({
        $or: [{
          _id: savedTrip.riderId
        }, {
          _id: savedTrip.driverId
        }]
      }, {
        $set: {
          currTripId: savedTrip._id,
          currTripState: "trip"
        }
      }, {
        "new": true,
        multi: true
      }).then(function () {
        (0, _transformResponse.fetchReturnObj)(savedTrip).then(function (returnObj) {
          (0, _pushNotification["default"])(riderID, "Driver has started trip");

          _socketStore["default"].emitByUserId(riderID, "tripUpdated", returnObj);

          cb(returnObj);
        });
      }).error(function (e) {
        _socketStore["default"].emitByUserId(savedTrip.riderId, "socketError", {
          message: "error while updating currTripId of user to start Trip",
          data: e
        });

        _socketStore["default"].emitByUserId(savedTrip.driverId, "socketError", {
          message: "error while updating currTripId of user to start Trip",
          data: e
        });
      });
    }).error(function (e) {
      cb(null);
      console.log("some error occured inside the socket Error");

      _socketStore["default"].emitByUserId(riderID, "socketError", e);

      _socketStore["default"].emitByUserId(driverID, "socketError", e);
    });
  });
  /**
   * tripUpdate emit is fired when rider or driver make any changes to trip Object
   * @param trip object
   * @return send tripUpdated event to the rider and driver with all the information related to trip
   */

  socket.on("tripUpdate", function (tripObj) {
    var riderID = tripObj.riderId;
    var driverID = tripObj.driverId;

    if (tripObj.tripStatus === "endTrip" && tripObj.riderRatingByDriver === 0 && tripObj.driverRatingByRider === 0) {
      var then = (0, _moment["default"])(tripObj.bookingTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ");
      var now = (0, _moment["default"])(new Date());
      tripObj.travelTime = _moment["default"].duration(then.diff(now));
      tripObj.tripDist = (0, _gpsDistance["default"])(tripObj.srcLoc[1], tripObj.srcLoc[0], tripObj.destLoc[1], tripObj.destLoc[0]);

      if (tripObj.travelTime < 0) {
        tripObj.travelTime = Math.abs(tripObj.travelTime);
      }

      _user["default"].updateAsync({
        $or: [{
          _id: tripObj.riderId
        }, {
          _id: tripObj.driverId
        }]
      }, {
        $set: {
          currTripId: null,
          currTripState: null
        }
      }, {
        "new": true,
        multi: true
      }).then(function () {
        // updated user records
        getConfig().then(function (data) {
          if (data.email.onEndTripRider) {// sendEmail(tripObj.riderId, tripObj, "endTrip");
          }

          if (data.email.onEndTripDriver) {// sendEmail(tripObj.driverId, tripObj, "endTrip");
          }

          if (data.sms.onEndTripRider) {// sendSms(tripObj.riderId, "You have reached the Destination");
          }

          if (data.sms.onEndTripDriver) {// sendSms(tripObj.driverId, "You have drop the Rider ");
          }
        });
      }).error(function (e) {
        _socketStore["default"].emitByUserId(tripObj.riderId, "socketError", {
          message: "error while updating currTripId of user to null when Trip ends",
          data: e
        });

        _socketStore["default"].emitByUserId(tripObj.driverId, "socketError", {
          message: "error while updating currTripId of user to null Trip ends",
          data: e
        });
      });
    }

    if (tripObj.riderRatingByDriver !== 0 || tripObj.driverRatingByRider !== 0) {
      updateUserRating(tripObj);
    } else if (tripObj.paymentMode === "CARD") {
      _payment["default"].cardPayment(tripObj).then(function (status) {
        tripObj.paymentStatus = status;

        _trip["default"].findOneAndUpdateAsync({
          _id: tripObj._id
        }, {
          $set: tripObj
        }, {
          "new": true
        }).then(function (updatedTripObject) {
          (0, _transformResponse.fetchReturnObj)(updatedTripObject).then(function (updatedTripObj) {
            _socketStore["default"].emitByUserId(riderID, "tripUpdated", updatedTripObj);

            _socketStore["default"].emitByUserId(driverID, "tripUpdated", updatedTripObj);
          });
        }).error(function (e) {
          _socketStore["default"].emitByUserId(riderID, "socketError", e);

          _socketStore["default"].emitByUserId(driverID, "socketError", e);
        });
      });
    } else {
      _trip["default"].findOneAndUpdateAsync({
        _id: tripObj._id
      }, {
        $set: tripObj
      }, {
        "new": true
      }).then(function (updatedTripObject) {
        (0, _transformResponse.fetchReturnObj)(updatedTripObject).then(function (updatedTripObj) {
          _socketStore["default"].emitByUserId(riderID, "tripUpdated", updatedTripObj);

          _socketStore["default"].emitByUserId(driverID, "tripUpdated", updatedTripObj);
        });
      }).error(function (e) {
        _socketStore["default"].emitByUserId(riderID, "socketError", e);

        _socketStore["default"].emitByUserId(driverID, "socketError", e);
      });
    }
  });
};

function updateUserRating(tripObj) {
  if (tripObj.riderRatingByDriver !== 0) {
    _trip["default"].findOneAndUpdateAsync({
      _id: tripObj._id
    }, {
      $set: {
        riderRatingByDriver: tripObj.riderRatingByDriver
      }
    }, {
      "new": true
    }).then(function (updatedTripObj) {
      _trip["default"].aggregateAsync([{
        $match: {
          riderId: updatedTripObj.riderId,
          tripStatus: "endTrip",
          riderRatingByDriver: {
            $gt: 0
          }
        }
      }, {
        $group: {
          _id: "$riderId",
          userRt: {
            $avg: "$riderRatingByDriver"
          }
        }
      }]).then(function (res) {
        if (res.length !== 0) {
          _user["default"].findOneAndUpdateAsync({
            _id: res[0]._id
          }, {
            $set: {
              userRating: res[0].userRt.toFixed(2)
            }
          }, {
            "new": true
          }).error(function (e) {
            _socketStore["default"].emitByUserId(tripObj.riderId, "socketError", e);

            _socketStore["default"].emitByUserId(tripObj.driverId, "socketError", e);
          });
        }
      }).error(function (e) {
        _socketStore["default"].emitByUserId(tripObj.riderId, "socketError", e);

        _socketStore["default"].emitByUserId(tripObj.driverId, "socketError", e);
      });
    }).error(function (e) {
      _socketStore["default"].emitByUserId(tripObj.riderId, "socketError", e);

      _socketStore["default"].emitByUserId(tripObj.driverId, "socketError", e);
    });
  }

  if (tripObj.driverRatingByRider !== 0) {
    _trip["default"].findOneAndUpdateAsync({
      _id: tripObj._id
    }, {
      $set: {
        driverRatingByRider: tripObj.driverRatingByRider,
        driverReviewByRider: tripObj.driverReviewByRider
      }
    }, {
      "new": true
    }).then(function (updatedTripObj) {
      _trip["default"].aggregateAsync([{
        $match: {
          driverId: updatedTripObj.driverId,
          tripStatus: "endTrip",
          driverRatingByRider: {
            $gt: 0
          }
        }
      }, {
        $group: {
          _id: "$driverId",
          userRt: {
            $avg: "$driverRatingByRider"
          }
        }
      }]).then(function (res) {
        if (res.length !== 0) {
          _user["default"].findOneAndUpdateAsync({
            _id: res[0]._id
          }, {
            $set: {
              userRating: res[0].userRt.toFixed(2)
            }
          }, {
            "new": true
          }).error(function (e) {
            _socketStore["default"].emitByUserId(tripObj.riderId, "socketError", e);

            _socketStore["default"].emitByUserId(tripObj.driverId, "socketError", e);
          });
        }
      }).error(function (e) {
        _socketStore["default"].emitByUserId(tripObj.riderId, "socketError", e);

        _socketStore["default"].emitByUserId(tripObj.driverId, "socketError", e);
      });
    }).error(function (e) {
      _socketStore["default"].emitByUserId(tripObj.riderId, "socketError", e);

      _socketStore["default"].emitByUserId(tripObj.driverId, "socketError", e);
    });
  }
}

var _default = startTripHandler;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=start-trip.js.map
