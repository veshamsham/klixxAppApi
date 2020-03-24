"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _adminSocket = _interopRequireDefault(require("./story/admin-socket"));

var _nearbyDriverHandler = _interopRequireDefault(require("./story/nearby-driver-handler"));

var _requestTrip = _interopRequireDefault(require("./story/request-trip"));

var _socketStore = _interopRequireDefault(require("../service/socket-store"));

var _startTrip = _interopRequireDefault(require("./story/start-trip"));

var _updateLocation = _interopRequireDefault(require("./story/update-location"));

var _userHandler = _interopRequireDefault(require("./story/user-handler"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var socketHandler = function socketHandler(socket) {
  (0, _requestTrip["default"])(socket);
  (0, _startTrip["default"])(socket);
  (0, _updateLocation["default"])(socket);
  (0, _nearbyDriverHandler["default"])(socket);
  (0, _adminSocket["default"])(socket);
  (0, _userHandler["default"])(socket);
  socket.on('hello', function () {
    socket.emit('helloResponse', 'hello everyone');
  });
  socket.on('disconnect', function () {
    _socketStore["default"].removeByUserId(socket.userId, socket);
  });
};

var _default = socketHandler;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=index.js.map
