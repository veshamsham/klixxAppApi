"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Schema = _mongoose["default"].Schema;
var PostSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  tripId: {
    type: Schema.Types.ObjectId,
    ref: "trip"
  },
  caption: {
    type: String,
    "default": null
  },
  imageUrl: {
    type: String,
    "default": null
  },
  tags: {
    type: [Schema.Types.ObjectId]
  },
  longAddress: {
    type: String,
    "default": null
  },
  shortAddress: {
    type: String,
    "default": null
  },
  loc: {
    type: [Number],
    index: "2d"
  },
  postedAt: {
    type: Date,
    "default": Date.now()
  }
});

var _default = _mongoose["default"].model("post", PostSchema);

exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=post.js.map
