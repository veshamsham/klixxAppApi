import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import APIError from "../helpers/APIError";
import UserSchema from "../models/user";

/**
 * checks for username
 * @returns {boolean : true| false}
 */
function getUsername(req, res) {
  UserSchema.find({
    userName: req.query.name.toLowerCase()
  })
    .then(data => {
      if (data.length) {
        const returnObj = {
          success: true,
          message: "",
          data: { availabe: false }
        };
        return res.send(returnObj);
      }
      const returnObj = {
        success: true,
        message: "",
        data: { availabe: true }
      };
      return res.send(returnObj);
    })
    .catch(e => {
      const err = new APIError(
        `error in updating user details while login ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
  // return res.send({ success: true, message: "user found", data: req.user });
}

export default {
  getUsername
};
