import httpStatus from "http-status";
import passport from "passport";
import APIError from "../helpers/APIError";
import config from "../../config/env";

function authGuard(req, res, next) {
  passport.authenticate(
    "jwt",
    config.passportOptions,
    (error, userDtls, info) => {
      //eslint-disable-line
      if (error) {
        const err = new APIError("token not matched", httpStatus.UNAUTHORIZED);
        return next(err);
      } else if (userDtls && userDtls.userType === "admin") {
        req.user = userDtls;
        next();
      } else {
        const err = new APIError(
          `token not matched and error msg ${info}`,
          httpStatus.UNAUTHORIZED
        );
        return next(err);
      }
    }
  );
}

module.exports = authGuard;
