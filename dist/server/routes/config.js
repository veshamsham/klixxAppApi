"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _appConfig = _interopRequireDefault(require("../controllers/appConfig"));

var _user = _interopRequireDefault(require("../controllers/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();

router.route('/forgot').post(_user["default"].forgotPassword); // /** GET /api/config/appConfig - Returns mobileApp config */

router.route('/appConfig').get(_appConfig["default"].getConfig).post(_appConfig["default"].updateConfig);
var _default = router;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=config.js.map
