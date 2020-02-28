"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _lodash = require("lodash");

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _transformResponse = require("../service/transform-response");

var _env = _interopRequireDefault(require("../../config/env"));

var _notification = _interopRequireDefault(require("../models/notification"));

var _user = _interopRequireDefault(require("../models/user"));

var _pushNotification = _interopRequireDefault(require("../service/pushNotification"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function createNotification(type, data) {
  switch (type) {
    case 'followed':
      return saveInDB(data);

    case 'post':
      return makePostNotificationData(data);
  }
}

function makePostNotificationData(notifyData) {
  _user["default"].find({
    followings: {
      $in: [notifyData.userId]
    }
  }).then(function (result) {
    var allPromises;
    var data = result.map(function (item) {
      (0, _pushNotification["default"])(item._id, 'New post by your friend');
      return new _notification["default"]({
        userId: item._id,
        type: 'post',
        link: notifyData.postId,
        toDisplayUser: notifyData.userId,
        date: Date.now()
      });
    });
    saveInDB(data);
  })["catch"](function (error) {
    console.log(error);
  });
}

function saveInDB(data) {
  if (Array.isArray(data)) {
    return _notification["default"].insertMany(data);
  }

  (0, _pushNotification["default"])(data.userId, 'You have a new follower');
  var notification = new _notification["default"](data);
  return notification.saveAsync()["catch"](function (error) {
    console.log(error);
  });
}

function getNotification(req, res, next) {
  var notifications;

  _notification["default"].find({
    userId: req.user._id
  }).populate('toDisplayUser', 'fname lname userName profileUrl').then(function (result) {
    notifications = result;

    _notification["default"].updateMany({
      userId: req.user._id
    }, {
      hasRead: true
    }).then(function (value) {
      return res.send({
        success: true,
        message: 'Your Notification List',
        data: notifications
      });
    });
  })["catch"](function (error) {
    return res.send({
      success: false,
      message: 'Failed to fetch your notification list',
      data: error
    });
  });
}

function markNotificationAsRead(req, res, next) {
  _notification["default"].findOneAndUpdate({
    _id: req.params.id
  }, {
    hasRead: true
  }).then(function (result) {
    if (!result) {
      return res.send({
        success: false,
        message: 'Notification does not exist',
        data: {}
      });
    }

    return res.send({
      success: true,
      message: 'Marked as read',
      data: {}
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      message: 'Failed to mark as read',
      data: err
    });
  });
}

function deleteNotification(req, res, next) {
  _notification["default"].findOneAndDelete({
    _id: req.params.id
  }).then(function (result) {
    if (!result) {
      return res.send({
        success: false,
        message: 'Notification does not exist',
        data: {}
      });
    }

    return res.send({
      success: true,
      message: 'Notification deleted',
      data: {}
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      message: 'Failed to delete notification',
      data: err
    });
  });
}

var _default = {
  createNotification: createNotification,
  getNotification: getNotification,
  markNotificationAsRead: markNotificationAsRead,
  deleteNotification: deleteNotification
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=notification.js.map
