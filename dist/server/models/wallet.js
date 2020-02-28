"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = _interopRequireDefault(require("mongoose"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Schema = _mongoose["default"].Schema;
var WalletSchema = new Schema({
  userEmail: {
    type: String,
    "default": null
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  userType: {
    type: String,
    "default": 'rider'
  },
  stripeAccountId: {
    type: String,
    "default": null
  },
  walletBalance: {
    type: Number,
    "default": 0
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

var _default = _mongoose["default"].model('Wallet', WalletSchema);

exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=wallet.js.map
