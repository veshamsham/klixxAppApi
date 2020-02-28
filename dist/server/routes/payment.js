"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _httpStatus = _interopRequireDefault(require("http-status"));

var _passport = _interopRequireDefault(require("passport"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

var _payment = _interopRequireDefault(require("../controllers/payment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();
/**
* Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
*/


router.use(function (req, res, next) {
  _passport["default"].authenticate('jwt', _env["default"].passportOptions, function (error, userDtls, info) {
    //eslint-disable-line
    if (error) {
      var err = new _APIError["default"]('token not matched', _httpStatus["default"].INTERNAL_SERVER_ERROR);
      return next(err);
    } else if (userDtls) {
      req.user = userDtls;
      next();
    } else {
      var _err = new _APIError["default"]("token is valid but no user found ".concat(info), _httpStatus["default"].UNAUTHORIZED);

      return next(_err);
    }
  })(req, res, next);
});
/** GET /api/payment - Returns wallet balance details for the user */
// router.route('/')
//   .post(paymentCtrl.payAll);

/** GET /api/payment/wallet - Returns wallet balance details for the rider triver and owner */

router.route('/wallet').post(_payment["default"].addBalance);
/** GET /api/payment/amount - Returns wallet balance details for the user */

router.route('/amount').post(_payment["default"].getBalance);
router.route('/checkSaveCard').post(_payment["default"].checkSaveCard);
router.route('/removeCard').post(_payment["default"].removeCard);
router.route('/addCard').post(_payment["default"].addCard);
router.route('/cardPayment').post(_payment["default"].cardPayment);
router.route('/updateCard').post(_payment["default"].updateCard);
var _default = router;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=payment.js.map
