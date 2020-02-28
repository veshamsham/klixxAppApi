"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _httpStatus = _interopRequireDefault(require("http-status"));

var _passport = _interopRequireDefault(require("passport"));

var _expressValidation = _interopRequireDefault(require("express-validation"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

var _appConfig = _interopRequireDefault(require("../controllers/appConfig"));

var _post = _interopRequireDefault(require("../controllers/post"));

var _paramValidation = _interopRequireDefault(require("../../config/param-validation"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();
/**
 * Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
 */


router.use(function (req, res, next) {
  _passport["default"].authenticate("jwt", _env["default"].passportOptions, function (error, userDtls, info) {
    //eslint-disable-line
    if (error) {
      var err = new _APIError["default"]("token not matched", _httpStatus["default"].INTERNAL_SERVER_ERROR);
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
/**  /api/posts -  */

router.route("/").post((0, _expressValidation["default"])(_paramValidation["default"].createPost), _post["default"].createPost).get(_post["default"].getByUserId).put(_post["default"].updatePost);
/** /api/posts/feed */

router.route("/feeds").get(_post["default"].fetchFollowingsPosts);
/** /api/posts/id -  */

router.route("/:id").get(_post["default"].getById)["delete"](_post["default"].deletePost);
var _default = router;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=post.js.map
