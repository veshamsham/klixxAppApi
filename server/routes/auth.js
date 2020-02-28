import express from 'express';
import validate from 'express-validation';
import httpStatus from 'http-status';
import passport from 'passport';
import paramValidation from '../../config/param-validation';
import APIError from '../helpers/APIError';
import authCtrl from '../controllers/auth';
import config from '../../config/env';

const router = express.Router();

/** POST /api/auth/login - Returns token if correct email and password is provided */
router.route('/login').post(validate(paramValidation.login), authCtrl.login);

router.route('/loginadmin').post(validate(paramValidation.loginadmin), authCtrl.loginadmin);

router.route('/checkuser').post(authCtrl.checkUser);

/**
 * Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
 */
router.use((req, res, next) => {
  passport.authenticate('jwt', config.passportOptions, (error, userDtls, info) => {
    //eslint-disable-line
    if (error) {
      const err = new APIError('token not matched', httpStatus.UNAUTHORIZED);
      return next(err);
    } else if (userDtls) {
      req.user = userDtls;
      next();
    } else {
      const err = new APIError(`token not matched and error msg ${info}`, httpStatus.UNAUTHORIZED);
      return next(err);
    }
  })(req, res, next);
});

// router.route('/random-number')
//   .get(authCtrl.getRandomNumber);

router.route('/logout').get(authCtrl.logout);

export default router;
