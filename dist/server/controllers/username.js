"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * checks for username
 * @returns {boolean : true| false}
 */
function getUsername(req, res) {
  _user["default"].find({
    userName: req.query.name.toLowerCase()
  }).then(function (data) {
    if (data.length) {
      var _returnObj = {
        success: true,
        message: "",
        data: {
          availabe: false
        }
      };
      return res.send(_returnObj);
    }

    var returnObj = {
      success: true,
      message: "",
      data: {
        availabe: true
      }
    };
    return res.send(returnObj);
  })["catch"](function (e) {
    var err = new _APIError["default"]("error in updating user details while login ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  }); // return res.send({ success: true, message: "user found", data: req.user });

}

var _default = {
  getUsername: getUsername
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=username.js.map
