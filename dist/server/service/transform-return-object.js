"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/* eslint-disable */
function transformReturnObj(Data) {
  if (Data instanceof Object) {
    Data = Data.toObject();

    if (Data.riderId) {
      Data.rider = Data.riderId;
      Data.riderId = Data.rider._id ? Data.rider._id : null;
    }

    if (Data.driverId) {
      Data.driver = Data.driverId;
      Data.driverId = Data.driver._id ? Data.driver._id : null;
    }
  }

  return Data;
}

var _default = {
  transformReturnObj: transformReturnObj
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=transform-return-object.js.map
