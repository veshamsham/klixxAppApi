"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _serverConfig = _interopRequireDefault(require("../models/serverConfig"));

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

//eslint-disable-line
function getConfig(req, res, next) {
  _serverConfig["default"].find(function (error, configData) {
    //eslint-disable-line
    if (error) {
      var err = new _APIError["default"]("error while finding corresponding data  ".concat(error), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      return next(err);
    }

    var configObj = {};

    _lodash["default"].map(configData, function (keyData) {
      configObj[keyData.key] = keyData.value;
    });

    res.send(configObj);
  });
}

function updateConfig(req, res, next) {
  var reqObj = Object.assign({}, req.body);
  var result = [];

  var keys = _lodash["default"].keys(reqObj);

  var values = _lodash["default"].values(reqObj);

  _lodash["default"].map(keys, function (keyitem, index) {
    _serverConfig["default"].findOneAsync({
      key: keyitem
    }).then(function (foundKey) {
      if (foundKey !== null) {
        _serverConfig["default"].findOneAndUpdateAsync({
          key: keyitem
        }, {
          $set: {
            value: values[index]
          }
        }, {
          "new": true
        }).then(function (updatedConfigObj) {
          if (updatedConfigObj) {
            result.push(updatedConfigObj);
            res.send(result);
          }
        }).error(function (e) {
          var err = new _APIError["default"]("error in updating user details while login ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          next(err);
        });
      } else {
        var newConfig = new _serverConfig["default"]({
          type: _typeof(values[index]),
          key: keyitem,
          value: values[index]
        });
        newConfig.saveAsync().then(function (savedConfigObj) {
          result.push(savedConfigObj);

          if (result.length === keys.length) {
            res.send(result);
          }
        }).error(function (e) {
          return next(e);
        });
      }
    });
  });
}

var _default = {
  getConfig: getConfig,
  updateConfig: updateConfig
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=server-config.js.map
