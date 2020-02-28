"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _mongoose = _interopRequireDefault(require("mongoose"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _user = _interopRequireDefault(require("./user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var debug = require("debug")("Taxi-app-backend-web-dashboard: trip model");

var Schema = _mongoose["default"].Schema;
var TripSchema = new Schema({
  riderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    "default": null
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    "default": null
  },
  srcLoc: {
    type: [Number],
    index: "2d"
  },
  destLoc: {
    type: [Number],
    index: "2d"
  },
  pickUpAddress: {
    type: String,
    "default": null
  },
  destAddress: {
    type: String,
    "default": null
  },
  latitudeDelta: {
    type: Number,
    "default": 0.0123
  },
  longitudeDelta: {
    type: Number,
    "default": 0.0123
  },
  paymentMode: {
    type: String,
    "default": "CASH"
  },
  paymentStatus: {
    type: String,
    "default": null
  },
  receiptUrl: {
    type: String,
    "default": null
  },
  tripAmt: {
    type: Number,
    "default": 0
  },
  tripDist: {
    type: Number,
    "default": 0
  },
  bookingTime: {
    type: Date,
    "default": Date.now
  },
  tripEndTime: {
    type: Date,
    "default": null
  },
  travelTime: {
    type: Number,
    "default": 0
  },
  taxiType: {
    type: String,
    "default": "TaxiGo"
  },
  riderRatingByDriver: {
    type: Number,
    "default": 0
  },
  driverRatingByRider: {
    type: Number,
    "default": 0
  },
  riderReviewByDriver: {
    type: String,
    "default": null
  },
  driverReviewByRider: {
    type: String,
    "default": null
  },
  seatBooked: {
    type: Number,
    "default": 0
  },
  tripStatus: {
    type: String,
    "default": "onTrip"
  },
  tripIssue: {
    type: String,
    "default": "noIssue"
  },
  roadMapUrl: {
    type: String,
    "default": null
  }
}); // TripSchema.path("riderId").validate((riderId, respond) => {
//   debug(`inside validator with riderId value ->${riderId}`);
//   return UserSchema.findByIdAsync(riderId).then(riderData => {
//     if (riderData) {
//       return respond(true);
//     } else {
//       debug(`rider validation failed ${riderData}`);
//       return respond(false);
//     }
//   });
// }, "Invalid Rider Id");
// TripSchema.path("driverId").validate((driverId, respond) => {
//   debug(`inside validator with driverId value ->${driverId}`);
//   return UserSchema.findByIdAsync(driverId).then(driverData => {
//     if (driverData) {
//       return respond(true);
//     } else {
//       debug(`driver validation failed ${driverData}`);
//       return respond(false);
//     }
//   });
// }, "Invalid DriverId");

TripSchema.statics = {
  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list: function list() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        skip = _ref.skip,
        limit = _ref.limit,
        filter = _ref.filter;

    var searchObj = {};

    switch (filter) {
      case "Ongoing":
        searchObj = {};
        searchObj.tripStatus = "onTrip";
        break;

      case "Completed":
        searchObj = {};
        searchObj.tripStatus = "endTrip";
        break;

      default:
        searchObj = {};
    }

    return this.find(searchObj).sort({
      _id: -1
    }).select("-__v").skip(skip).limit(limit).populate("riderId driverId").execAsync();
  },
  get: function get(tripId) {
    return this.findById(tripId).populate("riderId driverId").execAsync().then(function (tripObj) {
      if (tripObj) {
        return tripObj;
      }

      var err = new _APIError["default"]("No such trip exists!", _httpStatus["default"].NOT_FOUND);
      return Promise.reject(err);
    });
  },
  getCount: function getCount(filter) {
    var searchObj = {};

    switch (filter) {
      case "Ongoing":
        searchObj = {};
        searchObj.tripStatus = "onTrip";
        break;

      case "Completed":
        searchObj = {};
        searchObj.tripStatus = "endTrip";
        break;

      default:
        searchObj = {};
    }

    return this.count(searchObj).execAsync();
  }
};

var _default = _mongoose["default"].model("trip", TripSchema);

exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=trip.js.map
