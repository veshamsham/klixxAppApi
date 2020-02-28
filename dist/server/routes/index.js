"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _admin = _interopRequireDefault(require("./admin"));

var _auth = _interopRequireDefault(require("./auth"));

var _config = _interopRequireDefault(require("./config"));

var _payment = _interopRequireDefault(require("./payment"));

var _post = _interopRequireDefault(require("./post"));

var _syncData = _interopRequireDefault(require("./sync-data"));

var _trip = _interopRequireDefault(require("./trip"));

var _user = _interopRequireDefault(require("./user"));

var _verify = _interopRequireDefault(require("./verify"));

var _notification = _interopRequireDefault(require("./notification"));

var _username = _interopRequireDefault(require("../controllers/username"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();
/** GET /health-check - Check service health */


router.get("/health-check", function (req, res) {
  return res.send("OK");
});
router.get("/", function (req, res) {
  return res.send("OK");
}); // mount user routes at /verify

router.use("/verify", _verify["default"]); // mount user routes at /users

router.use("/users", _user["default"]); // mount check-username routes at /check-username

router.get("/check-username", _username["default"].getUsername); // mount user routes at /users

router.use("/config", _config["default"]); // mount auth routes at /auth

router.use("/auth", _auth["default"]); // mount trip routes at /trips

router.use("/trips", _trip["default"]); // mount sync data route at /sync-data

router.use("/syncData", _syncData["default"]); // mount admin routes at /admin

router.use("/admin", _admin["default"]); // mount payment routes at /payment

router.use("/payment", _payment["default"]); // mount post routes at /posts

router.use("/posts", _post["default"]); //mount notification routes at /notification

router.use('/notification', _notification["default"]);
var _default = router;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=index.js.map
