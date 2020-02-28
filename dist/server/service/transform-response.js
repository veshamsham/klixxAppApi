"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchReturnObj = fetchReturnObj;
exports.getRiderObj = getRiderObj;
exports.getDriverDtls = getDriverDtls;

var _bluebird = _interopRequireDefault(require("bluebird"));

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function fetchReturnObj(obj) {
  var returnObj = {};
  returnObj = obj.toObject();
  return new _bluebird["default"](function (resolve, reject) {
    getRiderObj(returnObj.riderId).then(function (riderObj) {
      if (riderObj) {
        returnObj.rider = riderObj;
      }
    }).then(function () {
      return getDriverDtls(returnObj.driverId, reject).then(function (driverObj) {
        returnObj.driver = driverObj;
      });
    }).then(function () {
      resolve(returnObj);
      return returnObj;
    });
  });
}

function getRiderObj(riderId) {
  return _user["default"].findOneAsync({
    _id: riderId,
    userType: 'rider'
  });
}

function getDriverDtls(driverId, reject) {
  return _user["default"].findOneAsync({
    _id: driverId,
    userType: 'driver'
  }) // .then((userDtls) => {
  //   if (userDtls) {
  //     return DriverSchema.findOneAsync({ driverId: userDtls._id }). then((driverExtraDetails) => {
  //       if (driverExtraDetails) {
  //         const userObject = userDtls.toObject();
  //         userObject.carDetails = driverExtraDetails.carDetails;
  //         return userObject;
  //       }
  //     })
  //     .error((e) => reject(e));
  //   }
  // })
  .error(function (errDriverDtls) {
    return reject(errDriverDtls);
  });
}
//# sourceMappingURL=transform-response.js.map
