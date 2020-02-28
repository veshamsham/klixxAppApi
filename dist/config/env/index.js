"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var env = process.env.NODE_ENV || 'development';

var config = require("./".concat(env)); //eslint-disable-line


var defaults = {
  root: _path["default"].join(__dirname, '/..')
};

var _default = Object.assign(defaults, config);

exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=index.js.map
