"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _expressValidation = _interopRequireDefault(require("express-validation"));

var _httpStatus = _interopRequireDefault(require("http-status"));

var _passport = _interopRequireDefault(require("passport"));

var _paramValidation = _interopRequireDefault(require("../../config/param-validation"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _auth = _interopRequireDefault(require("../controllers/auth"));

var _env = _interopRequireDefault(require("../../config/env"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();
/** POST /api/auth/login - Returns token if correct email and password is provided */


router.route('/login').post((0, _expressValidation["default"])(_paramValidation["default"].login), _auth["default"].login);
router.route('/loginadmin').post((0, _expressValidation["default"])(_paramValidation["default"].loginadmin), _auth["default"].loginadmin);
router.route('/checkuser').post(_auth["default"].checkUser);
/**
 * Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
 */

router.use(function (req, res, next) {
  _passport["default"].authenticate('jwt', _env["default"].passportOptions, function (error, userDtls, info) {
    //eslint-disable-line
    if (error) {
      var err = new _APIError["default"]('token not matched', _httpStatus["default"].UNAUTHORIZED);
      return next(err);
    } else if (userDtls) {
      req.user = userDtls;
      next();
    } else {
      var _err = new _APIError["default"]("token not matched and error msg ".concat(info), _httpStatus["default"].UNAUTHORIZED);

      return next(_err);
    }
  })(req, res, next);
}); // router.route('/random-number')
//   .get(authCtrl.getRandomNumber);

router.route('/logout').get(_auth["default"].logout);
var _default = router;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=auth.js.map
