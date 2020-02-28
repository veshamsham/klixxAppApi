"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _socketStore = _interopRequireDefault(require("../../service/socket-store.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable */
function dashboardHandler() {
  // console.log(socket, 'socket in dashboardHandler');
  // SocketStore.display();
  // SocketStore.emitByUserId(
  //   '59428b1bb0c3cc0f554fd52a',
  //   'getDriverDetails',
  //   'test'
  // );
  // const data = {
  //   name: 'admin',
  // };
  console.log(_socketStore["default"]); // socket.emit('getDriverDetails', data);
  // SocketStore.emitByUserId(
  //   '59428b1bb0c3cc0f554fd52a',
  //   'getDriverDetails',
  //   data
  // );
  // SocketStore.emitByUserId(tripRequestObj.riderId, 'socketError', { message: 'error while updating tripRequestStatus based on distance', data: err });
  // SocketStore.emitByUserId(tripRequestObj.driverId, 'socketError', { message: 'error while updating tripRequestStatus based on distance', data: err });
}

var _default = dashboardHandler;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=admin-socket.js.map
