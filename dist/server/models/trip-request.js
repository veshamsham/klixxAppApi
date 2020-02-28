"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Schema = _mongoose["default"].Schema;
var TripRequestSchema = new Schema({
  riderId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  driverId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'trip'
  },
  srcLoc: {
    type: [Number],
    index: '2d'
  },
  destLoc: {
    type: [Number],
    index: '2d'
  },
  paymentMode: {
    type: String,
    "default": 'CASH'
  },
  tripRequestStatus: {
    type: String,
    "default": 'request'
  },
  tripRequestIssue: {
    type: String,
    "default": 'busy'
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
    "default": 0.012
  },
  longitudeDelta: {
    type: Number,
    "default": 0.012
  },
  requestTime: {
    type: Date,
    "default": Date.now
  }
});
TripRequestSchema.statics = {
  userList: function userList() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$skip = _ref.skip,
        skip = _ref$skip === void 0 ? 0 : _ref$skip,
        _ref$limit = _ref.limit,
        limit = _ref$limit === void 0 ? 10 : _ref$limit,
        _ref$userId = _ref.userId,
        userId = _ref$userId === void 0 ? null : _ref$userId,
        _ref$userType = _ref.userType,
        userType = _ref$userType === void 0 ? null : _ref$userType;

    var searchObj = {};

    if (userType === 'rider') {
      searchObj = {};
      searchObj.riderId = userId;
    }

    if (userType === 'driver') {
      searchObj = {};
      searchObj.driverId = userId;
    }

    return this.find(searchObj).skip(skip).limit(limit).populate('riderId driverId tripId').execAsync();
  },
  getUserCount: function getUserCount(userType, userId) {
    var searchObj = {};

    if (userType === 'rider') {
      searchObj = {};
      searchObj.riderId = userId;
    }

    if (userType === 'driver') {
      searchObj = {};
      searchObj.driverId = userId;
    }

    return this.countAsync(searchObj);
  }
};

var _default = _mongoose["default"].model('tripRequest', TripRequestSchema);

exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=trip-request.js.map
