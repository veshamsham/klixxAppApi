"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Schema = _mongoose["default"].Schema;
var Notification = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  hasRead: {
    type: Boolean,
    "default": false
  },
  type: {
    type: String,
    "enum": ['followed', 'post']
  },
  toDisplayUser: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  link: {
    type: String,
    "default": null
  },
  date: {
    type: Date,
    "default": Date.now()
  }
});

var _default = _mongoose["default"].model("notification", Notification);

exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=notification.js.map
