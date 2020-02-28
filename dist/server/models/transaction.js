"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Schema = _mongoose["default"].Schema;
var TransactionSchema = new Schema({
  userIdTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  userIdFrom: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    "default": null
  },
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'trip',
    "default": null
  },
  createdAt: {
    type: Date,
    "default": Date.now
  },
  updatedAt: {
    type: Date,
    "default": Date.now
  }
});

var _default = _mongoose["default"].model('Transaction', TransactionSchema);

exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=transaction.js.map
