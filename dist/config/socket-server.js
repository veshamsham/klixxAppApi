"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _env = _interopRequireDefault(require("./env"));

var _socketHandler = _interopRequireDefault(require("../server/socketHandler"));

var _socketStore = _interopRequireDefault(require("../server/service/socket-store"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function startSocketServer(server) {
  var io = require("socket.io").listen(server); //eslint-disable-line


  console.log(server);
  console.log("SocketServer started11"); //eslint-disable-line

  io.on("connection", function (socket) {
    console.log("hi1"); // console.log('Client connected to socket', socket.id, '@@', socket.handshake.query.token); //eslint-disable-line

    var authToken = ""; // check for authentication of the socket

    if (socket.handshake.query && socket.handshake.query.token) {
      authToken = socket.handshake.query.token.replace("JWT ", "");
    }

    console.log(authToken);

    _jsonwebtoken["default"].verify(authToken, _env["default"].jwtSecret, function (err, userDtls) {
      // console.log(authToken, '--------');
      if (err) {
        console.log("error connection to socket=====");
        socket.disconnect();
      } else if (userDtls) {
        console.log(userDtls, "check user inside socket_server");
        socket.userId = userDtls._id; //eslint-disable-line

        console.log("inside socket server \n\n ".concat(userDtls._id, " ").concat(userDtls.email, " ").concat(userDtls.fname)); //eslint-disable-line

        _socketStore["default"].addByUserId(socket.userId, socket);

        (0, _socketHandler["default"])(socket); // call socketHandler to handle different socket scenario
      }
    });
  });
}

var _default = {
  startSocketServer: startSocketServer
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=socket-server.js.map
