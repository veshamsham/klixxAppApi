"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _deferred = _interopRequireDefault(require("deferred"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _httpStatus = _interopRequireDefault(require("http-status"));

var _APIError = _interopRequireDefault(require("../../helpers/APIError"));

var _appConfig = _interopRequireDefault(require("../../models/appConfig"));

var _env = _interopRequireDefault(require("../../../config/env"));

var _transformResponse = require("../../service/transform-response");

var _emailApi = _interopRequireDefault(require("../../service/emailApi"));

var _pushNotification = _interopRequireDefault(require("../../service/pushNotification"));

var _smsApi = _interopRequireDefault(require("../../service/smsApi"));

var _socketStore = _interopRequireDefault(require("../../service/socket-store.js"));

var _tripRequest = _interopRequireDefault(require("../../models/trip-request"));

var _user = _interopRequireDefault(require("../../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable */
//eslint-disable-line
var watchIdObj = {};
var promObj = {};
/**
 * Get appConfig
 * @returns {appConfig}
 */

function getConfig() {
  return new _bluebird["default"](function (resolve, reject) {
    _appConfig["default"].findOneAsync({
      key: "sendConfig"
    }).then(function (foundDetails) {
      resolve(foundDetails.value);
    })["catch"](function (err) {
      reject(err);
    });
  });
}

function requestTripHandler(socket) {
  socket.on("requestTrip", function (payload) {
    var quantum = 10;
    var riderID = payload.rider._id;
    nearByDriver(riderID).then(function (nearByDriversDoc) {
      // console.log(nearByDriversDoc, 'nearby user');
      for (var i = 0; i < nearByDriversDoc.length - 1; i++) {
        if (!checkSocketConnection(nearByDriversDoc[i]._id)) {
          nearByDriversDoc = removeDriverFromList(nearByDriversDoc, i);
        }
      }

      roundRobinAsync(nearByDriversDoc, quantum, payload).then(function (result) {
        console.log(result, "result round robin");

        if (result === false) {
          payload.tripRequest.tripRequestStatus = "noNearByDriver";
          (0, _pushNotification["default"])(riderID, "No nearby drivers");

          _socketStore["default"].emitByUserId(payload.rider._id, "tripRequestUpdated", payload.tripRequest);
        }
      })["catch"](function (e) {
        return console.log("error", e);
      });
    })["catch"](function (e) {
      return console.log("error", e);
    });
  });
  socket.on("requestDriverResponse", function (tripRequest) {
    clearInterval(watchIdObj[tripRequest._id]);
    var driverId = tripRequest.driver._id;
    promObj[driverId].resolve(tripRequest); // or resolve promise
  });
  socket.on("tripRequestUpdate", function (payload) {
    _tripRequest["default"].findOneAndUpdateAsync({
      _id: payload._id
    }, {
      $set: payload
    }, {
      "new": true
    }).then(function (updatedTripRequestObject) {
      if (updatedTripRequestObject.tripRequestStatus === "cancelled") {
        _user["default"].updateAsync({
          $or: [{
            _id: payload.riderId
          }, {
            _id: payload.driverId
          }]
        }, {
          $set: {
            currTripId: null,
            currTripState: null
          }
        }, {
          "new": true,
          multi: true
        }).then(function () {// updated user records
        }).error(function (e) {
          _socketStore["default"].emitByUserId(payload.riderId, "socketError", {
            message: "error while updating curTripId  to null in requestDriverResponse",
            data: e
          });

          _socketStore["default"].emitByUserId(payload.driverId, "socketError", {
            message: "error while updating curTripId to null in requestDriverResponse",
            data: e
          });
        });
      }

      (0, _transformResponse.fetchReturnObj)(updatedTripRequestObject).then(function (updatedTripRequestObj) {
        if (socket.userId.toString() === updatedTripRequestObj.riderId.toString()) {
          console.log("updatedTripRequestObj.riderId", updatedTripRequestObj.riderId);
          (0, _pushNotification["default"])(updatedTripRequestObj.riderId, updatedTripRequestObj.tripRequestStatus);
          (0, _pushNotification["default"])(updatedTripRequestObj.driver, updatedTripRequestObj.tripRequestStatus);

          _socketStore["default"].emitByUserId(updatedTripRequestObj.driverId, "tripRequestUpdated", updatedTripRequestObj);
        } else if (socket.userId.toString() === updatedTripRequestObj.driverId.toString()) {
          _socketStore["default"].emitByUserId(updatedTripRequestObj.riderId, "tripRequestUpdated", updatedTripRequestObj);

          (0, _pushNotification["default"])(updatedTripRequestObj.riderId, updatedTripRequestObj.tripRequestStatus);
          (0, _pushNotification["default"])(updatedTripRequestObj.driver, updatedTripRequestObj.tripRequestStatus);
        }
      });
    }).error(function (e) {
      // error occured while updating tripRequestObj
      _socketStore["default"].emitByUserId(payload.riderId, "socketError", e);

      _socketStore["default"].emitByUserId(payload.driverId, "socketError", e);
    });
  }); // Round robin algorithm for driver dispatch:

  function roundRobinAsync(nearByDriversDoc, quantum, rider) {
    console.log(nearByDriversDoc); // returns promise which resolves in success and faliure boolean values
    // suppose 5 drivers
    // each driver will be sent request.
    // expect a response in quantum time.
    // if response is accept - assign that driver. break process and return
    // if response is reject - remove driver from the list and select next driver to request from queue
    // if no response - next driver please.
    // - no arrival time burst time concept.
    // - queue structure will be based on database query fetch.

    return new _bluebird["default"](function (resolve, reject) {
      var count = 0;
      var remain = nearByDriversDoc.length;
      var prom = (0, _deferred["default"])();
      dispatchHandlerAsync(nearByDriversDoc, quantum, remain, count, rider, prom).then(function (result) {
        return resolve(result);
      })["catch"](function (error) {
        return reject(error);
      });
    });
  }

  function dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom) {
    console.log("here in dispatchHandlerAsync");

    if (remain <= 0) {
      prom.resolve(false);
      return prom.promise;
    }

    promObj[nearByDrivers[count]._id] = (0, _deferred["default"])();
    sendRequestAsync(nearByDrivers[count], quantum, rider, promObj[nearByDrivers[count]._id]).then(function (tripRequest) {
      var response = tripRequest.tripRequestStatus;

      if (response === "enRoute") {
        dispatchDriverAsync(tripRequest).then(function () {
          return prom.resolve(true);
        })["catch"](function (error) {
          return prom.reject(error);
        });
        getConfig().then(function (data) {
          if (data.email.rideAcceptRider) {// sendEmail(tripRequest.riderId, tripRequest, "rideAccept");
          }

          if (data.sms.rideAcceptRider) {// sendSms(tripRequest.riderId, "Your ride request is accepted .");
          }
        });
      } else if (response === "rejected") {
        resetTripRequestAsync(nearByDrivers[count]) // driver rejected so update the database to clear tripRequest made
        .then(function () {
          nearByDrivers = removeDriverFromList(nearByDrivers, count); // nearByDrivers.forEach((driver) => console.log(driver.Client connected to socket));

          count = 0;
          remain--;
          setTimeout(function () {
            dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom);
          }, 1000);
        });
      }
    }, function () {
      console.log("noResponseFromDriver");
      nearByDrivers = removeDriverFromList(nearByDrivers, count);
      count = 0;
      remain--;
      setTimeout(function () {
        dispatchHandlerAsync(nearByDrivers, quantum, remain, count, rider, prom);
      }, 1000);
    });
    return prom.promise;
  }

  function sendRequestAsync(driver, timeout, rider, def) {
    // return tripRequest object which contain response
    console.log("inside sendRequestAsync", driver.fname);
    createTripRequestObjAsync(rider, driver).then(function (tripRequestObj) {
      // here for notificatioon to add final
      (0, _pushNotification["default"])(driver._id, "New Ride Request");

      _socketStore["default"].emitByUserId(driver._id, "requestDriver", tripRequestObj);

      watchIdObj[tripRequestObj._id] = setInterval(function () {
        timeout--;

        if (timeout <= 0) {
          clearInterval(watchIdObj[tripRequestObj._id]);
          resetTripRequestAsync(driver) // driver did not respond so update the database to clear tripRequest made.
          .then(function () {
            _socketStore["default"].emitByUserId(driver._id, "responseTimedOut"); // clear tripRequest object on driver side
            // flag = true;


            def.reject("noResponseFromDriver");
          });
        }
      }, 1000);
    })["catch"](function (err) {
      return console.log("error", err);
    });
    return def.promise;
  }

  function dispatchDriverAsync(tripRequestObj) {
    return new _bluebird["default"](function (resolve) {
      _tripRequest["default"].findOneAndUpdateAsync({
        _id: tripRequestObj._id
      }, {
        $set: tripRequestObj
      }, {
        "new": true
      }).then(function (updatedTripRequestObject) {
        return resolve((0, _transformResponse.fetchReturnObj)(updatedTripRequestObject).then(function (updatedTripRequestObj) {
          if (updatedTripRequestObj.tripRequestStatus === "noNearByDriver") {
            updatedTripRequestObj.rider = null;
            updatedTripRequestObj.driver = null;
            updatedTripRequestObj.driverId = null;
          }

          _socketStore["default"].emitByUserId(tripRequestObj.riderId, "tripRequestUpdated", updatedTripRequestObj);
        }));
      }).error(function (e) {
        _socketStore["default"].emitByUserId(tripRequestObj.driverId, "socketError", e);
      });
    });
  }

  function removeDriverFromList(drivers, index) {
    // test passed
    return drivers.slice(0, index).concat(drivers.slice(index + 1));
  }

  function createTripRequestObjAsync(payload, driver) {
    return new _bluebird["default"](function (resolve) {
      var riderID = payload.rider._id;
      var srcLocation = payload.tripRequest.srcLoc;
      var destLocation = payload.tripRequest.destLoc;
      var pickUpAdrs = payload.tripRequest.pickUpAddress;
      var destAdrs = payload.tripRequest.destAddress;
      var latDelta = payload.tripRequest.latitudeDelta;
      var lonDelta = payload.tripRequest.longitudeDelta;
      var paymentMode = payload.tripRequest.paymentMode;
      var driverID = driver._id;
      var tripRequestObj = new _tripRequest["default"]({
        riderId: riderID,
        driverId: driverID,
        tripId: null,
        srcLoc: srcLocation,
        destLoc: destLocation,
        pickUpAddress: pickUpAdrs,
        destAddress: destAdrs,
        latitudeDelta: latDelta,
        longitudeDelta: lonDelta,
        paymentMode: paymentMode
      });
      tripRequestObj.saveAsync().then(function (savedTripRequest) {
        savedTripRequest.rider = null;
        savedTripRequest.driver = null;

        _user["default"].updateAsync({
          $or: [{
            _id: savedTripRequest.riderId
          }, {
            _id: savedTripRequest.driverId
          }]
        }, {
          $set: {
            currTripId: savedTripRequest._id,
            currTripState: "tripRequest"
          }
        }, {
          "new": true,
          multi: true
        }).then(function () {
          (0, _transformResponse.fetchReturnObj)(savedTripRequest).then(function (returnObj) {
            return resolve(returnObj);
          });
        }).error(function (e) {
          _socketStore["default"].emitByUserId(riderID, "socketError", {
            message: "error while updating curTripId in requestTrip",
            data: e
          });

          _socketStore["default"].emitByUserId(driverID, "socketError", {
            message: "error while updating curTripId in requestTrip",
            data: e
          });
        });
      }).error(function (e) {
        _socketStore["default"].emitByUserId(riderID, "socketError", e);
      });
    });
  }

  function resetTripRequestAsync(driverObj) {
    // query to reset tripRequest object for a particular driver in database.
    return new _bluebird["default"](function (resolve) {
      _user["default"].updateAsync({
        $or: [{
          _id: driverObj._id
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
        return resolve();
      }).error(function (e) {
        _socketStore["default"].emitByUserId(driverObj.riderId, "socketError", {
          message: "error while updating curTripId  to null in requestDriverResponse",
          data: e
        });

        _socketStore["default"].emitByUserId(driverObj.driverId, "socketError", {
          message: "error while updating curTripId to null in requestDriverResponse",
          data: e
        });
      });
    });
  }

  function checkSocketConnection(id) {
    var res = _socketStore["default"].getByUserId(id);

    if (res.success && res.data.length) {
      return true;
    } else {
      return false;
    }
  }

  function nearByDriver(riderId) {
    return new _bluebird["default"](function (resolve, reject) {
      return _user["default"].findOneAsync({
        _id: riderId,
        userType: "rider"
      }).then(function (userDoc) {
        if (userDoc) {
          // debug hereeeeee
          return _user["default"].findAsync({
            $and: [{
              gpsLoc: {
                $geoWithin: {
                  $centerSphere: [userDoc.mapCoordinates, _env["default"].radius]
                }
              }
            }, // { gpsLoc: { $geoWithin: { $center: [userDoc.gpsLoc, config.radius] } } },
            {
              currTripId: null,
              currTripState: null
            }, {
              loginStatus: true
            }, {
              userType: "driver"
            }, {
              isAvailable: true
            }]
          }).then(function (driverDoc) {
            if (driverDoc) {
              // console.log('hree list', driverDoc);
              return resolve(driverDoc);
            } else {
              // console.log('no nearByDriver driver found');
              var err = new _APIError["default"]("no nearByDriver found", _httpStatus["default"].INTERNAL_SERVER_ERROR);
              return reject(err);
            }
          }).error(function (driverErr) {
            // console.log('error while searching near by driver ');
            reject(driverErr);
          });
        } else {
          // console.log('no rider found with the given rider id');
          var err = new _APIError["default"]("no rider found with the given id", _httpStatus["default"].INTERNAL_SERVER_ERROR);
          return reject(err);
        }
      }).error(function (e) {
        // console.log('error while searching rider ');
        var err = new _APIError["default"]("error while searching user ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
        reject(err);
      });
    });
  }
}

var _default = requestTripHandler;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=request-trip.js.map
