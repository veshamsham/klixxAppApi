"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Schema = _mongoose["default"].Schema;
/**
 * AppConfig Schema
 */

var ServerConfigSchema = new _mongoose["default"].Schema({
  type: {
    type: Schema.Types.Mixed
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: Schema.Types.Mixed
  }
});

var _default = _mongoose["default"].model('ServerConfig', ServerConfigSchema);

exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=serverConfig.js.map
