"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _env = _interopRequireDefault(require("../../../config/env"));

var _socketStore = _interopRequireDefault(require("../../service/socket-store.js"));

var _user = _interopRequireDefault(require("../../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable */
//eslint-disable-line
function nearbyDriverHandler(socket) {
  socket.on('updatePickupRegion', function (userRegion) {
    // get the rider id
    // update the coordinates in database
    // for simulation emit coordinates to all connected drivers
    // fire query to get nearby drivers from database
    // emit the resultant array in callback
    var coordinates = [userRegion.region.longitude, userRegion.region.latitude];
    var userId = userRegion.user._id; // console.log(userId, '=========================');
    // for simulation only
    // socket.broadcast.emit('riderMapCoordinates', coordinates);
    // simulation ends

    console.log(coordinates);
    console.log(userId);

    _user["default"].findOneAndUpdateAsync({
      _id: userId
    }, {
      $set: {
        mapCoordinates: coordinates
      }
    }, {
      "new": true
    }).then(function (updatedUser) {
      return _user["default"].findAsync({
        $and: [{
          gpsLoc: {
            $geoWithin: {
              $centerSphere: [updatedUser.mapCoordinates, _env["default"].radius]
            }
          }
        }, {
          currTripId: null,
          currTripState: null
        }, {
          loginStatus: true
        }, {
          userType: '2'
        }, {
          isAvailable: true
        }]
      });
    }).then(function (driverArray) {
      if (driverArray) {
        console.log(driverArray.length, 'driverArray');

        _socketStore["default"].emitByUserId(userId, 'nearByDriversList', driverArray);
      }
    });
  });
}

var _default = nearbyDriverHandler;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=nearby-driver-handler.js.map
