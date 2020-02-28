"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _socketStore = _interopRequireDefault(require("../../service/socket-store.js"));

var _user = _interopRequireDefault(require("../../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

//eslint-disable-line

/**
 * user handler, handle update of the driver availability and send to riders
 * * @param socket object
 * @returns {*}
 */

/* eslint-disable */
function userHandler(socket) {
  socket.on('updateAvailable', function (userObj) {
    var userType = userObj.userType;
    var searchObj = {};

    if (userType === 'driver') {
      searchObj = {
        driverId: userObj._id
      };
    }

    var userID = userObj._id;

    _user["default"].findOneAndUpdateAsync({
      _id: userID
    }, {
      $set: {
        isAvailable: userObj.isAvailable
      }
    }, {
      "new": true
    }).then(function (updatedUser) {
      _socketStore["default"].emitByUserId(userID, 'updateAvailable', updatedUser);

      _socketStore["default"].emitToAll('updateAvailable', updatedUser);
    }).error(function (e) {
      _socketStore["default"].emitByUserId(userID, 'socketError', e);
    });
  });
}

var _default = userHandler;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=user-handler.js.map
