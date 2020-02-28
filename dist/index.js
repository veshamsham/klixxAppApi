"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _bluebird = _interopRequireDefault(require("bluebird"));

var _mongoose = _interopRequireDefault(require("mongoose"));

var _env = _interopRequireDefault(require("./config/env"));

var _express = _interopRequireDefault(require("./config/express"));

var _socketServer = _interopRequireDefault(require("./config/socket-server"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// promisify mongoose
_bluebird["default"].promisifyAll(_mongoose["default"]); // connect to mongo db


_mongoose["default"].connect(_env["default"].db, {
  bufferMaxEntries: 0,
  socketTimeoutMS: 0,
  keepAlive: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false
}, function () {
  if (_env["default"].env === "test") {
    _mongoose["default"].connection.db.dropDatabase();
  }
});

_mongoose["default"].connection.on("error", function () {
  throw new Error("unable to connect to database: ".concat(_env["default"].db));
  s;
});

var debug = require("debug")("Taxi-app-backend-web-dashboard:index"); // starting socket server


_socketServer["default"].startSocketServer(_express["default"]); // listen on port config.port


_express["default"].listen(process.env.PORT || _env["default"].port, function () {
  console.log("server started on Port: ".concat(_env["default"].port, " Environment:").concat(_env["default"].env));
});

var _default = _express["default"];
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=index.js.map
