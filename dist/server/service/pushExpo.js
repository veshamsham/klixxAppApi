"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _expoServerSdk = _interopRequireDefault(require("expo-server-sdk"));

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// To check if something is a push token
// const isPushToken = Exponent.isExponentPushToken(somePushToken);
var expo = new _expoServerSdk["default"]();

function sendNotification(userId, notification) {
  _user["default"].findOneAsync({
    _id: userId
  }).then(function (userObj) {
    try {
      var isPushToken = _expoServerSdk["default"].isExponentPushToken(userObj.pushToken);

      if (isPushToken) {
        var receipts = expo.sendPushNotificationsAsync([{
          to: userObj.pushToken,
          sound: 'default',
          body: notification,
          data: {
            withSome: notification
          }
        }]); // console.log(receipts);

        return receipts;
      }
    } catch (error) {
      return error; // console.error(error);
    }
  });
}

var _default = sendNotification;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=pushExpo.js.map
