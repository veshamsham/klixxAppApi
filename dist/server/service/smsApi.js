"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _twilio = _interopRequireDefault(require("twilio"));

var _serverConfig = _interopRequireDefault(require("../models/serverConfig"));

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function getSmsApiDetails() {
  return new Promise(function (resolve, reject) {
    _serverConfig["default"].findOneAsync({
      key: 'smsConfig'
    }).then(function (foundDetails) {
      console.log(foundDetails, 'checkDetails');
      resolve(foundDetails.value);
    })["catch"](function (err) {
      reject(err);
    });
  });
}

function sendSms(userId, smsText) {
  console.log(userId, 'check userId inside sendSMs');

  _user["default"].findOneAsync({
    _id: userId
  }).then(function (userObj) {
    console.log(userObj, 'userObj from find');
    getSmsApiDetails().then(function (details) {
      console.log(details, 'check details of smsApiConfig');
      var twilio = new _twilio["default"](details.accountSid, details.token);
      twilio.messages.create({
        from: details.from,
        to: userObj.phoneNo,
        body: smsText
      }, function (err, result) {
        if (err) {
          return err;
        }

        return result;
      });
    });
  });
}

var _default = sendSms;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=smsApi.js.map
