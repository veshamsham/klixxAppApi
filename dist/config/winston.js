"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _winston = _interopRequireDefault(require("winston"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var logger = _winston["default"].createLogger({
  transports: [new _winston["default"].transports.Console({
    json: true,
    colorize: true
  })]
});

var _default = logger;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=winston.js.map
