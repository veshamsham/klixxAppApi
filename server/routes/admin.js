import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import validate from 'express-validation';
import adminTrip from '../controllers/admin-trip';
import adminTripUser from '../controllers/admin-trip-user';
import adminUser from '../controllers/admin-user';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import paramValidation from '../../config/param-validation';
import serverCtrl from '../controllers/server-config'; //eslint-disable-line

const router = express.Router();

router
  .route('/trip')
  .get(validate(paramValidation.tripList), adminTrip.tripDetails)
  .post(validate(paramValidation.createNewTrip), adminTrip.createNewTrip)
  .put(validate(paramValidation.updateTripObject), adminTrip.updateTrip);

router.route('/allusers').post(adminUser.getTotalUsers);
router.route('/ongoingtrips').get(adminTrip.getOngoingTripDetails);

router.route('/recentreviewedtrips').get(adminTrip.getRecentReviewedTripDetails);
router.route('/approvePendingUsers').get(validate(paramValidation.pending), adminUser.getApprovePendingUsers);
router.route('/approveUser').put(validate(paramValidation.approve), adminUser.approveUser);
router.route('/rejectUser').put(validate(paramValidation.reject), adminUser.rejectUser);
router.route('/activeDriverDetails').get(adminUser.getActiveDriverDetails);
router.route('/activeCustomerDetails').get(adminUser.getActiveCustomerDetails);

router.route('/specificusertrips/:userId').get(adminTrip.getSpecificUserTripDetails);

router.route('/serverConfigObj').get(serverCtrl.getConfig);

router.route('/serverConfig').post(serverCtrl.updateConfig);

// /api/admin/user
router
  .route('/user')
  .get(adminUser.getAllUsers)
  .post(validate(paramValidation.createNewUser), adminUser.createNewUser)
  .put(validate(paramValidation.updateUserByAdmin), adminUser.updateUserDetails);

router.route('/changepassword').post(adminUser.changePassword);

router.use((req, res, next) => {
  passport.authenticate('jwt', config.passportOptions, (error, userDtls, info) => {
    //eslint-disable-line
    if (error) {
      const err = new APIError('token not matched', httpStatus.UNAUTHORIZED);
      return next(err);
    } else if (userDtls && userDtls.userType === 'admin') {
      req.user = userDtls;
      next();
    } else {
      const err = new APIError(`token not matched and error msg ${info}`, httpStatus.UNAUTHORIZED);
      return next(err);
    }
  })(req, res, next);
});
// server Config
router
  .route('/serverConfig')
  .get(serverCtrl.getConfig)
  .post(serverCtrl.updateConfig);

// /api/admin/allusers
router.route('/allusers').get(adminUser.getTotalUsers);

router.route('/userDetails/:userId').get(adminUser.getUsersDetails);

router.route('/user/userStatsChart').get(adminUser.userStats);

// /api/admin/trip

// .put(adminTrip.updateTrip);

router.route('/trip/charts').get(validate(paramValidation.tripRevenueGraph), adminTrip.tripRevenueGraph);

router.route('/trip/charts/:revenueYear').get(validate(paramValidation.tripRevenueGraph), adminTrip.tripRevenueGraph);

router.route('/trip/:tripId').get(validate(paramValidation.userTripRequestList), adminTrip.loadTripDetails);

router.route('/trip/user/:userId').get(validate(paramValidation.userTripRequestList), adminTripUser.userTripDetails);

router.route('/trip/user/charts/:userId').get(validate(paramValidation.userTripRequestList), adminTripUser.userTripRequestStatics);

export default router;
