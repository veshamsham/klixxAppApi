"use strict";

var _httpStatus = _interopRequireDefault(require("http-status"));

var _passport = _interopRequireDefault(require("passport"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function authGuard(req, res, next) {
  _passport["default"].authenticate("jwt", _env["default"].passportOptions, function (error, userDtls, info) {
    //eslint-disable-line
    if (error) {
      var err = new _APIError["default"]("token not matched", _httpStatus["default"].UNAUTHORIZED);
      return next(err);
    } else if (userDtls && userDtls.userType === "admin") {
      req.user = userDtls;
      next();
    } else {
      var _err = new _APIError["default"]("token not matched and error msg ".concat(info), _httpStatus["default"].UNAUTHORIZED);

      return next(_err);
    }
  });
}

module.exports = authGuard;
//# sourceMappingURL=auth.js.map
