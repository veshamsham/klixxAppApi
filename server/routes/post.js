import express from "express";
import httpStatus from "http-status";
import passport from "passport";
import validate from 'express-validation';
import APIError from "../helpers/APIError";
import config from "../../config/env";
import appConfigCtrl from "../controllers/appConfig";
import postCtrl from "../controllers/post";
import paramValidation from '../../config/param-validation';

const router = express.Router();

/**
 * Middleware for protected routes. All protected routes need token in the header in the form Authorization: JWT token
 */
router.use((req, res, next) => {
  passport.authenticate(
    "jwt",
    config.passportOptions,
    (error, userDtls, info) => {
      //eslint-disable-line
      if (error) {
        const err = new APIError(
          "token not matched",
          httpStatus.INTERNAL_SERVER_ERROR
        );
        return next(err);
      } else if (userDtls) {
        req.user = userDtls;
        next();
      } else {
        const err = new APIError(
          `token is valid but no user found ${info}`,
          httpStatus.UNAUTHORIZED
        );
        return next(err);
      }
    }
  )(req, res, next);
});

/**  /api/posts -  */
router
  .route("/")
  .post(validate(paramValidation.createPost), postCtrl.createPost)
  .get(postCtrl.getByUserId)
  .put(postCtrl.updatePost);

/** /api/posts/feed */
router
  .route("/feeds")
  .get(postCtrl.fetchFollowingsPosts);

/** /api/posts/id -  */
router
  .route("/:id")
  .get(postCtrl.getById)
  .delete(postCtrl.deletePost);

export default router;
