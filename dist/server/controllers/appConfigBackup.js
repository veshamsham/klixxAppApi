"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _appConfig = _interopRequireDefault(require("../models/appConfig"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _ = require('lodash');
/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */


function getConfig(req, res, next) {
  _appConfig["default"].find(function (error, configData) {
    //eslint-disable-line
    if (error) {
      var err = new _APIError["default"]("error while finding version number for the user  ".concat(error), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      return next(err);
    }

    res.send(configData);
  });
}

function updateVersion(next) {
  return new Promise(function (resolve, reject) {
    _appConfig["default"].findOneAsync({
      key: 'version'
    }).then(function (foundKey) {
      if (foundKey !== null) {
        var prevValue = foundKey.value;
        var newVersion = prevValue + 1;

        _appConfig["default"].findOneAndUpdateAsync({
          key: 'version'
        }, {
          $set: {
            value: newVersion,
            type: 'Number'
          }
        }, {
          "new": true
        }).then(function (updatedVersion) {
          if (updatedVersion) {
            resolve(updatedVersion);
          }
        }).error(function (e) {
          var err = new _APIError["default"]("error in updating user details while login ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
          next(err);
        });
      } else {
        var newVersionConfig = new _appConfig["default"]({
          type: 'Number',
          key: 'version',
          value: 1
        });
        newVersionConfig.saveAsync().then(function (savedVersionConfigObj) {
          resolve(savedVersionConfigObj);
        }).error(function (e) {
          return reject(e);
        });
      }
    });
  });
}

function updateConfig(req, res, next) {
  var reqObj = Object.assign({}, req.body);
  var result = [];

  var keys = _.keys(reqObj);

  var values = _.values(reqObj);

  _.map(keys, function (keyitem, index) {
    _appConfig["default"].findOneAsync({
      key: keyitem
    }).then(function (foundKey) {
      if (foundKey !== null) {
        if (foundKey.value !== values[index]) {
          _appConfig["default"].findOneAndUpdateAsync({
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

              if (result.length === keys.length) {
                updateVersion(next).then(function (versionConfig) {
                  result.push(versionConfig);
                  res.send(result);
                });
              }
            }
          }).error(function (e) {
            var err = new _APIError["default"]("error in updating user details while login ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
            next(err);
          });
        } else {
          result.push(foundKey);

          if (result.length === keys.length) {
            res.send(result);
          }
        }
      } else {
        var newConfig = new _appConfig["default"]({
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

function getConfigVersion(req, res, next) {
  _appConfig["default"].find(function (error, configData) {
    //eslint-disable-line
    if (error) {
      var err = new _APIError["default"]("error while finding version number for the user  ".concat(error), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      return next(err);
    }

    var returnObj = {
      success: true,
      message: 'config version number',
      data: configData.version
    };
    res.send(returnObj);
  });
}

var _default = {
  getConfigVersion: getConfigVersion,
  getConfig: getConfig,
  updateConfig: updateConfig
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=appConfigBackup.js.map
