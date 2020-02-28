"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

var _trip = _interopRequireDefault(require("../models/trip"));

var _tripRequest = _interopRequireDefault(require("../models/trip-request"));

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function tripDetails(req, res, next) {
  var limit = req.query.limit ? req.query.limit : _env["default"].limit;
  var pageNo = req.query.pageNo ? req.query.pageNo : 1;
  var skip = pageNo ? (pageNo - 1) * limit : _env["default"].skip;
  var filter = req.query.filter ? req.query.filter : _env["default"].tripFilter;

  _trip["default"].getCount(filter).then(function (totalTripRecords) {
    //eslint-disable-line
    var returnObj = {
      success: false,
      message: "no of trips are zero",
      data: null,
      meta: {
        totalNoOfPages: Math.ceil(totalTripRecords / limit),
        limit: limit,
        currPageNo: pageNo,
        totalRecords: totalTripRecords.length
      }
    };

    if (totalTripRecords < 1) {
      returnObj.success = true;
      returnObj.data = [];
      returnObj.meta.totalNoOfPages = 0;
      returnObj.meta.limit = limit;
      returnObj.meta.currPageNo = 0;
      returnObj.meta.totalRecords = 0;
      return res.send(returnObj);
    }

    if (skip > totalTripRecords) {
      var err = new _APIError["default"]("Request Page does not exists", _httpStatus["default"].NOT_FOUND);
      return next(err);
    }

    _trip["default"].list({
      skip: skip,
      limit: limit,
      filter: filter
    }).then(function (tripData) {
      if (tripData.length !== 0) {
        for (var i = 0; i < tripData.length; i++) {
          //eslint-disable-line
          tripData[i] = transformReturnObj(tripData[i]);
        }

        returnObj.success = true;
        returnObj.message = "trip object retrieved";
        returnObj.data = tripData;
      } else {
        returnObj.success = true;
        returnObj.message = "no trip details available";
      }

      res.send(returnObj);
    }).error(function (e) {
      var err = new _APIError["default"]("Error occured while retreiving trip object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError["default"]("Error occured while counting trip object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function getOngoingTripDetails(req, res, next) {
  addDriverRider().then(function (returnObj) {
    returnObj.success = true;
    returnObj.message = "no of trips are ".concat(returnObj.data.length);
    returnObj.meta.totalRecords = "".concat(returnObj.data.length);
    res.send(returnObj);
  })["catch"](function (err) {
    next(err);
  });
}

function addDriverRider() {
  return new Promise(function (resolve, reject) {
    _trip["default"].find({
      tripStatus: "onTrip"
    }).then(function (ongoingTripRecords) {
      var returnObj = {
        success: true,
        message: "no of trips are zero",
        data: null,
        meta: {
          totalRecords: ongoingTripRecords.length
        }
      };
      returnObj.data = ongoingTripRecords;
      var r1 = JSON.parse(JSON.stringify(returnObj));
      addRider(r1).then(function (responseObj) {
        return addDriver(responseObj);
      }).then(function (responseObj) {
        return resolve(responseObj);
      })["catch"](function (err) {
        reject(err);
      });
    })["catch"](function (err) {
      reject(err);
    }); // find catch

  });
}

function getSpecificUserTripDetails(req, res, next) {
  var userId = req.params.userId;
  var returnObj = {
    success: false,
    message: "user Id is not defined",
    data: null
  };

  if (userId) {
    _trip["default"].find({
      $or: [{
        driverId: userId
      }, {
        riderId: userId
      }]
    }).then(function (tripData) {
      if (tripData) {
        returnObj.success = true;
        returnObj.message = "user found and its corresponding trip details";
        returnObj.data = tripData;
        var r1 = JSON.parse(JSON.stringify(returnObj));
        addRider(r1).then(function (responseObj) {
          return addDriver(responseObj);
        }).then(function (responseObj) {
          responseObj.success = true;
          responseObj.message = "no of trips are ".concat(responseObj.data.length);
          res.send(responseObj);
        })["catch"](function (err) {
          next(err);
        });
      } else {
        returnObj.success = false;
        returnObj.message = "user trip details not found with the given id";
        returnObj.data = null;
        res.send(returnObj);
      } // res.send(returnObj);

    })["catch"](function (err) {
      next(err);
    });
  } else {
    res.send(returnObj);
  }
}

function getRecentReviewedTripDetails(req, res, next) {
  _trip["default"].find({
    tripStatus: "endTrip"
  }).then(function (recentReviewedTripRecords) {
    var returnObj = {
      success: true,
      message: "no of trips are zero",
      data: null,
      meta: {
        totalRecords: recentReviewedTripRecords.length
      }
    };
    returnObj.data = recentReviewedTripRecords;
    var r1 = JSON.parse(JSON.stringify(returnObj));
    addRider(r1).then(function (responseObj) {
      return addDriver(responseObj);
    }).then(function (responseObj) {
      responseObj.success = true;
      responseObj.message = "no of trips are ".concat(responseObj.data.length);
      responseObj.meta.totalRecords = "".concat(responseObj.data.length);
      res.send(responseObj);
    })["catch"](function (err) {
      next(err);
    });
  })["catch"](function (err) {
    next(err);
  });
}

function addRider(returnObj) {
  return new Promise(function (resolve, reject) {
    Promise.all(returnObj.data.map(function (item, index) {
      return _user["default"].findOneAsync({
        _id: item.riderId
      }).then(function (result) {
        returnObj.data[index] = Object.assign({}, returnObj.data[index], {
          profileUrl: result.profileUrl,
          riderName: result.fname + result.lname
        });
        return Promise.resolve(returnObj.data[index]);
      });
    })).then(function (rider) {
      if (rider) {
        console.log("Rider created", rider); //eslint-disable-line
      }

      return resolve(returnObj);
    })["catch"](function (err) {
      if (err) {
        console.log("error", err); //eslint-disable-line
      }

      return reject(returnObj);
    });
  });
}

function addDriver(returnObj) {
  return new Promise(function (resolve, reject) {
    Promise.all(returnObj.data.map(function (item, index) {
      return _user["default"].findOneAsync({
        _id: item.driverId
      }).then(function (result) {
        returnObj.data[index] = Object.assign({}, returnObj.data[index], {
          driverName: result.fname + result.lname
        });
        return Promise.resolve(returnObj.data[index]);
      });
    })).then(function (driver) {
      if (driver) {
        console.log("Driver created", driver); //eslint-disable-line
      }

      return resolve(returnObj);
    })["catch"](function (err) {
      if (err) {
        console.log("err", err); //eslint-disable-line
      }

      return reject(returnObj);
    });
  });
}

function createNewTrip(req, res, next) {
  var riderId = req.body.riderId;
  var driverId = req.body.driverId;

  _user["default"].findAsync({
    $or: [{
      $and: [{
        userType: "rider"
      }, {
        _id: riderId
      }]
    }, {
      $and: [{
        userType: "driver"
      }, {
        _id: driverId
      }]
    }]
  }).then(function (foundUserData) {
    //eslint-disable-line
    if (foundUserData.length !== 2) {
      var err = new _APIError["default"]("rider or driver does not exist", _httpStatus["default"].BAD_REQUEST);
      return next(err);
    }

    if (foundUserData[0].currTripId !== null || foundUserData[1].currTripId !== null) {
      var errMsg = "";

      if (foundUserData[0].userType === "rider" && foundUserData[0].currTripId === null) {
        errMsg += "Rider is On Trip";
      }

      if (foundUserData[1].userType === "driver" && foundUserData[1].currTripId === null) {
        errMsg += "Driver is On Trip";
      }

      var _err = new _APIError["default"](errMsg, _httpStatus["default"].BAD_REQUEST);

      return next(_err);
    }

    var tripObj = new _trip["default"]({
      riderId: req.body.riderId,
      driverId: req.body.driverId,
      srcLoc: req.body.srcLoc ? req.body.srcLoc : [1, 2],
      destLoc: req.body.destLoc ? req.body.destLoc : [3, 4],
      pickUpAddress: req.body.pickUpAddress,
      destAddress: req.body.destAddress
    });
    tripObj.saveAsync().then(function (newTripObj) {
      var returnObj = {
        success: true,
        message: "trip object created",
        data: newTripObj,
        meta: null
      };
      var tripRequest = new _tripRequest["default"]({
        riderId: newTripObj.riderId,
        driverId: newTripObj.driverId,
        tripId: newTripObj._id,
        //eslint-disable-line
        srcLoc: newTripObj.srcLoc,
        destLoc: newTripObj.destLoc,
        pickUpAddress: newTripObj.pickUpAddress,
        destAddress: newTripObj.destAddress,
        tripRequestStatus: "completed",
        tripRequestIssue: "noIssue"
      });
      tripRequest.saveAsync().then(function () {
        _user["default"].updateAsync({
          $or: [{
            _id: newTripObj.riderId
          }, {
            _id: newTripObj.driverId
          }]
        }, {
          $set: {
            currTripId: newTripObj._id,
            currTripState: "trip"
          }
        }, {
          multi: true
        }) //eslint-disable-line
        .then(function () {
          res.send(returnObj);
        }).error(function (e) {
          var err = new _APIError["default"]("Error occured while Updating User Object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          next(err);
        });
      }).error(function (e) {
        var err = new _APIError["default"]("Error occured while Saving Trip Request Object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
        next(err);
      });
    }).error(function (e) {
      var err = new _APIError["default"]("Error occured while saving trip object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      next(err);
    });
  }).error(function (e) {
    var err = new _APIError["default"]("Error occured while finding rider or driver ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function updateTrip(req, res, next) {
  var tripId = req.body._id; //eslint-disable-line

  var tripObj = {
    riderId: req.body.riderId,
    driverId: req.body.driverId,
    srcLoc: req.body.srcLoc ? req.body.srcLoc : [1, 2],
    destLoc: req.body.destLoc ? req.body.destLoc : [2, 2],
    pickUpAddress: req.body.pickUpAddress ? req.body.pickUpAddress : "new Dehli",
    destAddress: req.body.destAddress ? req.body.destAddress : "mumbai",
    tripAmt: req.body.tripAmt ? req.body.tripAmt : 0,
    tripIssue: req.body.tripIssue ? req.body.tripIssue : "noIssue",
    tripStatus: req.body.tripStatus ? req.body.tripStatus : "OnTrip",
    tripEndTime: req.body.tripEndTime ? req.body.tripEndTime : null,
    paymentMode: req.body.paymentMode ? req.body.paymentMode : "cash",
    taxiType: req.body.taxiType ? req.body.taxiType : "taxiMini",
    riderRatingByDriver: req.body.riderRatingByDriver ? req.body.riderRatingByDriver : 0,
    driverRatingByRider: req.body.driverRatingByRider ? req.body.driverRatingByRider : 0,
    riderReviewByDriver: req.body.riderReviewByDriver ? req.body.riderReviewByDriver : null,
    driverReviewByRider: req.body.driverReviewByRider ? req.body.driverReviewByRider : null,
    seatBooked: req.body.seatBooked ? req.body.seatBooked : 1
  };

  _trip["default"].findOneAndUpdateAsync({
    _id: tripId
  }, {
    $set: tripObj
  }, {
    "new": 1,
    runValidators: true
  }).then(function (updatedTripObj) {
    //eslint-disable-line
    var returnObj = {
      success: false,
      message: "unable to update trip object as trip id provided didnt match",
      data: null,
      meta: null
    };

    if (updatedTripObj) {
      returnObj.success = true;
      returnObj.message = "trip object updated";
      returnObj.data = updatedTripObj;

      if (updatedTripObj.tripStatus === "endTrip") {
        _user["default"].updateAsync({
          $or: [{
            _id: updatedTripObj.riderId
          }, {
            _id: updatedTripObj.driverId
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
          return res.send(returnObj);
        }) // sending the updated tripObj in the fronted
        .error(function (e) {
          var err = new _APIError["default"]("Error occured while updatating User Object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          return next(err);
        });
      }
    } else {
      var err = new _APIError["default"]("Trip Id did not matched", _httpStatus["default"].BAD_REQUEST);
      return next(err);
    } // res.send(returnObj);

  }).error(function (e) {
    var err = new _APIError["default"]("Error occured while updatating trip object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function loadTripDetails(req, res, next) {
  var tripId = req.params.tripId;

  _trip["default"].get(tripId).then(function (tripData) {
    var returnObj = {
      success: true,
      message: "trip object found",
      data: transformReturnObj(tripData)
    };
    res.send(returnObj);
  }).error(function (e) {
    return next(e);
  });
}

function tripRevenueGraph(req, res, next) {
  var lastYearDate = new Date();
  lastYearDate.setDate(1);
  lastYearDate.setMonth(lastYearDate.getMonth() - 11);
  lastYearDate = new Date(lastYearDate);
  var returnObj = {
    success: false,
    message: "no of trips avaliable",
    data: [],
    lastYearDate: lastYearDate
  };

  _trip["default"].aggregateAsync([{
    $match: {
      bookingTime: {
        $gt: lastYearDate
      }
    }
  }, {
    $project: {
      year: {
        $year: "$bookingTime"
      },
      month: {
        $month: "$bookingTime"
      },
      tripAmt: "$tripAmt",
      tripStatus: "$tripStatus"
    }
  }, {
    $match: {
      tripStatus: "endTrip"
    }
  }, {
    $group: {
      _id: "RevenueGraph",
      1: {
        $sum: {
          $cond: [{
            $eq: ["$month", 1]
          }, "$tripAmt", 0]
        }
      },
      2: {
        $sum: {
          $cond: [{
            $eq: ["$month", 2]
          }, "$tripAmt", 0]
        }
      },
      3: {
        $sum: {
          $cond: [{
            $eq: ["$month", 3]
          }, "$tripAmt", 0]
        }
      },
      4: {
        $sum: {
          $cond: [{
            $eq: ["$month", 4]
          }, "$tripAmt", 0]
        }
      },
      5: {
        $sum: {
          $cond: [{
            $eq: ["$month", 5]
          }, "$tripAmt", 0]
        }
      },
      6: {
        $sum: {
          $cond: [{
            $eq: ["$month", 6]
          }, "$tripAmt", 0]
        }
      },
      7: {
        $sum: {
          $cond: [{
            $eq: ["$month", 7]
          }, "$tripAmt", 0]
        }
      },
      8: {
        $sum: {
          $cond: [{
            $eq: ["$month", 8]
          }, "$tripAmt", 0]
        }
      },
      9: {
        $sum: {
          $cond: [{
            $eq: ["$month", 9]
          }, "$tripAmt", 0]
        }
      },
      10: {
        $sum: {
          $cond: [{
            $eq: ["$month", 10]
          }, "$tripAmt", 0]
        }
      },
      11: {
        $sum: {
          $cond: [{
            $eq: ["$month", 11]
          }, "$tripAmt", 0]
        }
      },
      12: {
        $sum: {
          $cond: [{
            $eq: ["$month", 12]
          }, "$tripAmt", 0]
        }
      }
    }
  }]).then(function (revenueGraphDocs) {
    returnObj.success = true;
    returnObj.message = "revenue graph for the trip";
    returnObj.data = revenueGraphDocs;
    res.send(returnObj);
  }).error(function (e) {
    var err = new _APIError["default"]("Error occured while computing revenue graph ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

function transformReturnObj(tripData) {
  if (tripData instanceof Object) {
    tripData = tripData.toObject();

    if (tripData.riderId) {
      tripData.rider = tripData.riderId;
      tripData.riderId = tripData.rider._id ? tripData.rider._id : null; //eslint-disable-line
    }

    if (tripData.driverId) {
      tripData.driver = tripData.driverId;
      tripData.driverId = tripData.driver._id ? tripData.driver._id : null; //eslint-disable-line
    }
  }

  return tripData;
}

var _default = {
  tripDetails: tripDetails,
  getOngoingTripDetails: getOngoingTripDetails,
  getRecentReviewedTripDetails: getRecentReviewedTripDetails,
  createNewTrip: createNewTrip,
  updateTrip: updateTrip,
  loadTripDetails: loadTripDetails,
  tripRevenueGraph: tripRevenueGraph,
  getSpecificUserTripDetails: getSpecificUserTripDetails
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=admin-trip.js.map
