"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var url = "https://onesignal.com/api/v1/notifications";

function sendNotification(userId, notification) {
  _user["default"].findOneAsync({
    _id: userId
  }).then(function (userObj) {
    if (!userObj) {
      throw new Error('No Such User Exist');
    }

    var App_id = userObj.userType === 'rider' ? 'df137503-fb26-4180-aebc-ca6835152506' : '96124b53-6eb7-4fdf-bd98-d188b51e28de';
    var Api_key = userObj.userType === 'rider' ? 'ZDU5ODgzMzUtNDhkYi00N2NhLWEzZjMtYzEzYzg3YjgwOTZm' : 'N2Q0YWY0OGQtODRkNi00YjQ3LWE2YzMtOGY3Mzg1YmNmMTMz';
    (0, _nodeFetch["default"])(url, {
      method: 'POST',
      body: JSON.stringify({
        app_id: App_id,
        contents: {
          en: notification
        },
        include_player_ids: [userObj.deviceId],
        //userObj.deviceId
        data: {
          source: 'message'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Api_key
      }
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      console.log('RESPONSE', data);
    })["catch"](function (err) {
      console.log('ERROR', err);
    });
  });
}

var _default = sendNotification;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=pushNotification.js.map
