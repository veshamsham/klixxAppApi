import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import APIError from "../helpers/APIError";
import config from "../../config/env";
import UserSchema from "../models/user";

/**
 * Returns jwt token  and user object if valid email and password is provided
 * @param req (email, password, userType)
 * @param res
 * @param next
 * @returns {jwtAccessToken, user}
 */

function testServer(req, res, next) {
  return res.send({
    success: true,
    message: "Server Test Running.",
  });
}


function loginadmin(req, res, next) {
  UserSchema.findOneAsync(
    {
      email: req.body.email,
      $or: [{ userType: "admin" }, { userType: "superAdmin" }]
    },
    "+password"
  )
    .then(user => {
      //eslint-disable-line
      if (!user) {
        const err = new APIError(
          "User not found with the given email id",
          httpStatus.NOT_FOUND
        );
        return next(err);
      } else {
        user.comparePassword(req.body.password, (passwordError, isMatch) => {
          //eslint-disable-line
          if (passwordError || !isMatch) {
            const err = new APIError(
              "Incorrect password",
              httpStatus.UNAUTHORIZED
            );
            return next(err);
          }
          user.loginStatus = true;
          user.gpsLoc = [77.85368273308545, 12.02172902354515];
          const token = jwt.sign(user.toJSON(), config.jwtSecret);
          UserSchema.findOneAndUpdateAsync(
            { _id: user._id },
            { $set: user },
            { new: true }
          ) //eslint-disable-line
            .then(updatedUser => {
              const returnObj = {
                success: true,
                message: "user successfully logged in",
                data: {
                  jwtAccessToken: `JWT ${token}`,
                  user: updatedUser
                }
              };
              res.json(returnObj);
            })
            .error(err123 => {
              const err = new APIError(
                `error in updating user details while login ${err123}`,
                httpStatus.INTERNAL_SERVER_ERROR
              );
              next(err);
            });
        });
      }
    })
    .error(e => {
      const err = new APIError(
        `erro while finding user ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

function login(req, res, next) {
  console.log('Auth login')
  const userObj = {
    email: req.body.email,
    userType: req.body.userType
  };

  UserSchema.findOneAsync(userObj, "+password")
    .then(user => {
      //eslint-disable-line
      if (!user) {
        const err = new APIError(
          "User not found with the given email id",
          httpStatus.NOT_FOUND
        );
        return next(err);
      } else {
        user.comparePassword(req.body.password, (passwordError, isMatch) => {
          //eslint-disable-line
          if (passwordError || !isMatch) {
            const err = new APIError(
              "Incorrect password",
              httpStatus.UNAUTHORIZED
            );
            return next(err);
          }
          user.loginStatus = true;
          user.gpsLoc = [77.85368273308545, 12.02172902354515];
          const token = jwt.sign(user.toJSON(), config.jwtSecret);
          UserSchema.findOneAndUpdateAsync(
            { _id: user._id },
            { $set: user },
            { new: true }
          ) //eslint-disable-line
            .then(updatedUser => {
              const returnObj = {
                success: true,
                message: "user successfully logged in",
                data: {
                  jwtAccessToken: `JWT ${token}`,
                  user: updatedUser
                }
              };
              res.json(returnObj);
            })
            .error(err123 => {
              const err = new APIError(
                `error in updating user details while login ${err123}`,
                httpStatus.INTERNAL_SERVER_ERROR
              );
              next(err);
            });
        });
      }
    })
    .error(e => {
      const err = new APIError(
        `erro while finding user ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

/** This is a protected route. Change login status to false and send success message.
 * @param req
 * @param res
 * @param next
 * @returns success message
 */

function logout(req, res, next) {
  const userObj = req.user;
  if (userObj === undefined || userObj === null) {
    console.log("user obj is null or undefined inside logout function"); //eslint-disable-line
  }
  userObj.loginStatus = false;
  userObj.isAvailable = false;
  UserSchema.findOneAndUpdate(
    { _id: userObj._id, loginStatus: true },
    { $set: userObj },
    { new: true },
    (err, userDoc) => {
      //eslint-disable-line
      if (err) {
        const error = new APIError(
          "error while updateing login status",
          httpStatus.INTERNAL_SERVER_ERROR
        );
        next(error);
      }
      if (userDoc) {
        const returnObj = {
          success: true,
          message: "user logout successfully"
        };
        res.json(returnObj);
      } else {
        const error = new APIError("user not found", httpStatus.NOT_FOUND);
        next(error);
      }
    }
  );
}

// { $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }] }
function checkUser(req, res) {
  UserSchema.findOneAsync({ email: req.body.email })
    .then(foundUser => {
      if (foundUser !== null) {
        const jwtAccessToken = jwt.sign(foundUser.toJSON(), config.jwtSecret);
        const returnObj = {
          success: true,
          message: "User Exist",
          data: {}
        };
        returnObj.data = {
          user: foundUser,
          jwtAccessToken: `JWT ${jwtAccessToken}`
        };
        return res.send(returnObj);
      } else {
        const returnObj = {
          success: true,
          message: "New User"
        };
        return res.send(returnObj);
      }
    })
    .catch(error => {
      console.log(error); //eslint-disable-line
    });
}

export default {
  login,
  logout,
  checkUser,
  loginadmin,
  testServer
};
