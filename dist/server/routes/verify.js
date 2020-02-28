"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _verify = _interopRequireDefault(require("../controllers/verify"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();

router.route('/email').post(_verify["default"].emailVerify).put(_verify["default"].emailVerify).get(_verify["default"].emailVerify); // /** GET /api/verify/mobileVerify -  */

router.route('/mobile').get(_verify["default"].mobileVerify).post(_verify["default"].mobileVerify);
var _default = router;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=verify.js.map
