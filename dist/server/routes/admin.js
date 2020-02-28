"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _httpStatus = _interopRequireDefault(require("http-status"));

var _passport = _interopRequireDefault(require("passport"));

var _expressValidation = _interopRequireDefault(require("express-validation"));

var _adminTrip = _interopRequireDefault(require("../controllers/admin-trip"));

var _adminTripUser = _interopRequireDefault(require("../controllers/admin-trip-user"));

var _adminUser = _interopRequireDefault(require("../controllers/admin-user"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _env = _interopRequireDefault(require("../../config/env"));

var _paramValidation = _interopRequireDefault(require("../../config/param-validation"));

var _serverConfig = _interopRequireDefault(require("../controllers/server-config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

//eslint-disable-line
var router = _express["default"].Router();

router.route('/trip').get((0, _expressValidation["default"])(_paramValidation["default"].tripList), _adminTrip["default"].tripDetails).post((0, _expressValidation["default"])(_paramValidation["default"].createNewTrip), _adminTrip["default"].createNewTrip).put((0, _expressValidation["default"])(_paramValidation["default"].updateTripObject), _adminTrip["default"].updateTrip);
router.route('/allusers').post(_adminUser["default"].getTotalUsers);
router.route('/ongoingtrips').get(_adminTrip["default"].getOngoingTripDetails);
router.route('/recentreviewedtrips').get(_adminTrip["default"].getRecentReviewedTripDetails);
router.route('/approvePendingUsers').get((0, _expressValidation["default"])(_paramValidation["default"].pending), _adminUser["default"].getApprovePendingUsers);
router.route('/approveUser').put((0, _expressValidation["default"])(_paramValidation["default"].approve), _adminUser["default"].approveUser);
router.route('/rejectUser').put((0, _expressValidation["default"])(_paramValidation["default"].reject), _adminUser["default"].rejectUser);
router.route('/activeDriverDetails').get(_adminUser["default"].getActiveDriverDetails);
router.route('/activeCustomerDetails').get(_adminUser["default"].getActiveCustomerDetails);
router.route('/specificusertrips/:userId').get(_adminTrip["default"].getSpecificUserTripDetails);
router.route('/serverConfigObj').get(_serverConfig["default"].getConfig);
router.route('/serverConfig').post(_serverConfig["default"].updateConfig); // /api/admin/user

router.route('/user').get(_adminUser["default"].getAllUsers).post((0, _expressValidation["default"])(_paramValidation["default"].createNewUser), _adminUser["default"].createNewUser).put((0, _expressValidation["default"])(_paramValidation["default"].updateUserByAdmin), _adminUser["default"].updateUserDetails);
router.route('/changepassword').post(_adminUser["default"].changePassword);
router.use(function (req, res, next) {
  _passport["default"].authenticate('jwt', _env["default"].passportOptions, function (error, userDtls, info) {
    //eslint-disable-line
    if (error) {
      var err = new _APIError["default"]('token not matched', _httpStatus["default"].UNAUTHORIZED);
      return next(err);
    } else if (userDtls && userDtls.userType === 'admin') {
      req.user = userDtls;
      next();
    } else {
      var _err = new _APIError["default"]("token not matched and error msg ".concat(info), _httpStatus["default"].UNAUTHORIZED);

      return next(_err);
    }
  })(req, res, next);
}); // server Config

router.route('/serverConfig').get(_serverConfig["default"].getConfig).post(_serverConfig["default"].updateConfig); // /api/admin/allusers

router.route('/allusers').get(_adminUser["default"].getTotalUsers);
router.route('/userDetails/:userId').get(_adminUser["default"].getUsersDetails);
router.route('/user/userStatsChart').get(_adminUser["default"].userStats); // /api/admin/trip
// .put(adminTrip.updateTrip);

router.route('/trip/charts').get((0, _expressValidation["default"])(_paramValidation["default"].tripRevenueGraph), _adminTrip["default"].tripRevenueGraph);
router.route('/trip/charts/:revenueYear').get((0, _expressValidation["default"])(_paramValidation["default"].tripRevenueGraph), _adminTrip["default"].tripRevenueGraph);
router.route('/trip/:tripId').get((0, _expressValidation["default"])(_paramValidation["default"].userTripRequestList), _adminTrip["default"].loadTripDetails);
router.route('/trip/user/:userId').get((0, _expressValidation["default"])(_paramValidation["default"].userTripRequestList), _adminTripUser["default"].userTripDetails);
router.route('/trip/user/charts/:userId').get((0, _expressValidation["default"])(_paramValidation["default"].userTripRequestList), _adminTripUser["default"].userTripRequestStatics);
var _default = router;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=admin.js.map
