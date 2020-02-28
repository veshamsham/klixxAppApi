"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _expressValidation = _interopRequireDefault(require("express-validation"));

var _httpStatus = _interopRequireDefault(require("http-status"));

var _passport = _interopRequireDefault(require("passport"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

var _paramValidation = _interopRequireDefault(require("../../config/param-validation"));

var _user = _interopRequireDefault(require("../controllers/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = _express["default"].Router();
/** POST /api/users/register - create new user and return corresponding user object and token */


router.route("/register").post((0, _expressValidation["default"])(_paramValidation["default"].createUser), _user["default"].create);
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
      var _err = new _APIError["default"]("token not matched ".concat(info), _httpStatus["default"].UNAUTHORIZED);

      return next(_err);
    }
  })(req, res, next);
});
router.route("/")
/** GET /api/users - Get user */
.get(_user["default"].get)
/** PUT /api/users - Update user */
.put(_user["default"].update)
/** DELETE /api/users - Delete user */
["delete"](_user["default"].remove);
router.route('/person/:id').get(_user["default"].getUserDetails);
router.route('/person/list/:id').get(_user["default"].fetchPersonUsers, _user["default"].fetchFollowingsOrFollowers);
router.route('/list').get(_user["default"].fetchMyProfileUsers, _user["default"].fetchFollowingsOrFollowers);
router.route('/add-following')
/** POST /api/users/add-follower - Add User to the following list */
.post(_user["default"].addFollowing);
router.route('/remove-following')
/** POST /api/users/remove-following- Remove User from the following list */
.post(_user["default"].removeFollowing);
router.route('/remove-follower')
/** POST /api/users/remove-follower - Remove User from the following list */
.post(_user["default"].removeFollower);
router.route('/search').get(_user["default"].searchUser);
/** Load user when API with userId route parameter is hit */

router.param("userId", _user["default"].load);
router.route("/upload")
/** PUT /api/users/upload - Update user pic */
.put(_user["default"].upload);
var _default = router;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=user.js.map
