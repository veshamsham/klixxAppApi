import bcrypt from "bcrypt";
import { get as _get } from "lodash";
import cloudinary from "cloudinary";
import httpStatus from "http-status";
import formidable from "formidable";
import jwt from "jsonwebtoken";
import APIError from "../helpers/APIError";
import AppConfig from "../models/appConfig";
import config from "../../config/env";
import sendEmail from "../service/emailApi";
import notificationCtrl from './notification';
import ServerConfig from "../models/serverConfig"; //eslint-disable-line
import User from "../models/user";
import uuid from "uuid";
const uuidv5 = require("uuid");

/**
 * Get user
 * @returns {User}
 */
function get(req, res) {
  return res.send({ success: true, message: "user found", data: req.user });
}

/**
 * Get getCloudinaryDetails
 * @returns {getCloudinaryDetails}

 */
function getCloudinaryDetails() {
  return new Promise((resolve, reject) => {
    ServerConfig.findOneAsync({ key: "cloudinaryConfig" })
      .then(foundDetails => {
        resolve(foundDetails.value);
      })
      .catch(err => {
        reject(err);
      });
  });
}

/**
 * Get appConfig
 * @returns {appConfig}
 */
function getConfig() {
  return new Promise((resolve, reject) => {
    AppConfig.findOneAsync({ key: "sendConfig" })
      .then(foundDetails => {
        resolve(foundDetails.value);
      })
      .catch(err => {
        reject(err);
      });
  });
}
function getApproveConfig() {
  return new Promise((resolve, reject) => {
    AppConfig.findOneAsync({ key: "approveConfig" })
      .then(foundDetails => {
        resolve(foundDetails.value);
      })
      .catch(err => {
        reject(err);
      });
  });
}
/**
 * Create new user
 * @property {string} req.body.username - The username of user.
 * @property {string} req.body.mobileNumber - The mobileNumber of user.
 * @returns {User}
 */
// { email: req.body.email, phoneNo: req.body.phoneNo }
function create(req, res, next) {
  console.log("User Register")
  User.findOneAsync({
    $or: [
      { $and: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }] },
      { $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo }] }
    ]
  }).then(foundUser => {
    console.log(foundUser, "@@@@@@@@@@@@@@@@@@@######################");
    if (foundUser !== null && foundUser.userType === req.body.userType) {
      User.findOneAndUpdateAsync(
        { _id: foundUser._id },
        { $set: { loginStatus: true } },
        { new: true }
      ) //eslint-disable-line
        // eslint-disable-next-line
        .then(updateUserObj => {
          if (updateUserObj) {
            console.log(updateUserObj, "userObj");
            const jwtAccessToken = jwt.sign(
              updateUserObj.toJSON(),
              config.jwtSecret
            );
            const returnObj = {
              success: true,
              message: "",
              data: {}
            };
            console.log(returnObj, "after jwtAccessToken");
            returnObj.data.jwtAccessToken = `JWT ${jwtAccessToken}`;
            returnObj.data.user = updateUserObj;
            returnObj.message = "user already exist";
            returnObj.success = false;
            return res.send(returnObj);
          }
        })
        .error(e => {
          const err = new APIError(
            `error in updating user details while login ${e}`,
            httpStatus.INTERNAL_SERVER_ERROR
          );
          next(err);
        });
    } else {
      getApproveConfig().then(values => {
        const optValue = Math.floor(100000 + Math.random() * 900000);
        const user = new User({
          email: req.body.email,
          password: req.body.password,
          userType: req.body.userType,
          fname: req.body.fname,
          lname: req.body.lname,
          userName: String(req.body.userName).toLowerCase() || uuid(),
          phoneNo: req.body.phoneNo,
          gpsLoc: [req.body.lat, req.body.lon],
          carDetails: req.body.userType === "driver" ? { type: "sedan" } : {},
          mapCoordinates: [0, 0],
          // isApproved:
          //   req.body.userType, 
          //   === "driver"
          //     ? values.autoApproveDriver
          //     : values.autoApproveRider,
          loginStatus: true,
          otp: optValue
        });
        user
          .saveAsync()
          .then(savedUser => {
            console.log(savedUser, "savedUserObj");
            const returnObj = {
              success: true,
              message: "",
              data: {}
            };
            const jwtAccessToken = jwt.sign(
              savedUser.toJSON(),
              config.jwtSecret
            );
            returnObj.data.jwtAccessToken = `JWT ${jwtAccessToken}`;
            returnObj.data.user = savedUser;
            returnObj.message = "user created successfully";
            console.log(returnObj, "check userCreated");
            res.send(returnObj);
            getConfig().then(data => {
              // get new object to add in    host=req.get('host');
              // link="http://"+req.get('host')+"/verify/email?check="+saveduser.otp "&email=" +savedUser.email;
              if (data.sms.otpVerify) {
                // sendSms(savedUser._id, `Your OTP is ->` + optValue); //eslint-disable-line
              }
              if (data.email.emailVerify) {
                // sendEmail(savedUser._id, savedUser, "emailVerify"); //eslint-disable-line
              }
              if (
                data.email.onRegistrationRider &&
                savedUser.userType === "rider"
              ) {
                // sendEmail(savedUser._id, savedUser, "register"); //eslint-disable-line
              }
              if (
                data.email.onRegistrationDriver &&
                savedUser.userType === "driver"
              ) {
                // sendEmail(savedUser._id, savedUser, "register"); //eslint-disable-line
              }
            });
          })
          .error(e => next(e));
      });
    }
  });
}

/**
 * Update existing user
 * @property {Object} req.body.user - user object containing all fields.
 * @returns {User}
 */
function update(req, res, next) {
  const user = req.user;
  user.fname = req.body.fname ? req.body.fname : user.fname;
  user.lname = req.body.lname ? req.body.lname : user.lname;
  user.email = req.body.email ? req.body.email : user.email;
  user.phoneNo = req.body.phoneNo ? req.body.phoneNo : user.phoneNo;
  user.deviceId = req.body.deviceId ? req.body.deviceId : user.deviceId;
  user.pushToken = req.body.pushToken ? req.body.pushToken : user.deviceId;
  user.tokenId = req.body.tokenId ? req.body.tokenId : user.tokenId;
  user.emergencyDetails = req.body.emergencyDetails
    ? req.body.emergencyDetails
    : user.emergencyDetails;
  user.homeAddress = req.body.homeAddress
    ? req.body.homeAddress
    : user.homeAddress;
  user.workAddress = req.body.workAddress
    ? req.body.workAddress
    : user.workAddress;
  user.carDetails = req.body.carDetails ? req.body.carDetails : user.carDetails;
  user.licenceDetails = req.body.licenceDetails
    ? req.body.licenceDetails
    : user.licenceDetails;
  user.bankDetails = req.body.bankDetails
    ? req.body.bankDetails
    : user.bankDetails;
  user.isAvailable = req.body.isAvailable;
  user
    .saveAsync()
    .then(savedUser => {
      const returnObj = {
        success: true,
        message: "user details updated successfully",
        data: savedUser
      };
      res.send(returnObj);
    })
    .error(e => next(e));
}

/**
 * function  to upload pic
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */

function upload(req, res, next) {
  getCloudinaryDetails().then(value => {
    if (value) {
      cloudinary.config({
        cloud_name: value.cloud_name,
        api_key: value.api_key,
        api_secret: value.api_secret
      });
      const form = new formidable.IncomingForm();
      form.on("error", err => {
        console.error(err, "error heree"); //eslint-disable-line
      });

      form.parse(req, (err, fields, files) => {
        console.log(files, "parse image");
        const imgpath = files.image;
        cloudinary.v2.uploader.upload(imgpath.path, (error, results) => {
          if (error) {
            console.log(error, "error upload");
          }
          if (results) {
            const user = req.user;
            if (req.headers.updatetype === "profile") {
              user.profileUrl = results.url;
              User.findOneAndUpdateAsync(
                { _id: user._id }, //eslint-disable-line
                { $set: { profileUrl: results.url } },
                { new: true }
              )
                .then(savedUser => {
                  const returnObj = {
                    success: true,
                    message: "user pic updated successfully",
                    data: savedUser
                  };
                  res.send(returnObj);
                })
                .error(e => next(e));
            }
            if (req.headers.updatetype === "licence") {
              user.profileUrl = results.url;
              User.findOneAndUpdateAsync(
                { _id: user._id }, //eslint-disable-line
                { $set: { licenceUrl: results.url } },
                { new: true }
              )
                .then(savedUser => {
                  const returnObj = {
                    success: true,
                    message: "user licenceDetails updated successfully",
                    data: savedUser
                  };
                  res.send(returnObj);
                })
                .error(e => next(e));
            }
            if (req.headers.updatetype === "permit") {
              user.profileUrl = results.url;
              User.findOneAndUpdateAsync(
                { _id: user._id }, //eslint-disable-line
                { $set: { vechilePaperUrl: results.url } },
                { new: true }
              )
                .then(savedUser => {
                  const returnObj = {
                    success: true,
                    message: "user vechilePaperUrl updated successfully",
                    data: savedUser
                  };
                  res.send(returnObj);
                })
                .error(e => next(e));
            }
            if (req.headers.updatetype === "insurance") {
              user.profileUrl = results.url;
              User.findOneAndUpdateAsync(
                { _id: user._id }, //eslint-disable-line
                { $set: { insuranceUrl: results.url } },
                { new: true }
              )
                .then(savedUser => {
                  const returnObj = {
                    success: true,
                    message: "user insuranceUrl updated successfully",
                    data: savedUser
                  };
                  res.send(returnObj);
                })
                .error(e => next(e));
            }
            if (req.headers.updatetype === "registration") {
              user.profileUrl = results.url;
              User.findOneAndUpdateAsync(
                { _id: user._id }, //eslint-disable-line
                { $set: { rcBookUrl: results.url } },
                { new: true }
              )
                .then(savedUser => {
                  const returnObj = {
                    success: true,
                    message: "user rcBookUrl updated successfully",
                    data: savedUser
                  };
                  res.send(returnObj);
                })
                .error(e => next(e));
            }
          }
        });
      });
    } else {
      const returnObj = {
        success: false,
        message: "Problem in updating",
        data: req.user
      };
      res.send(returnObj);
    }
  });
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
// function list(req, res, next) {
//   const { limit = 50, skip = 0 } = req.query;
//   User.list({ limit, skip }).then((users) => res.json(users))
//     .error((e) => next(e));
// }
/**
 * Delete user.
 * @returns {User}
 */
function remove(req, res, next) {
  const user = req.user;
  user
    .removeAsync()
    .then(deletedUser => {
      const returnObj = {
        success: true,
        message: "user deleted successfully",
        data: deletedUser
      };
      res.send(returnObj);
    })
    .error(e => next(e));
}
/**
 * Load user and append to req.
 */
function load(req, res, next, id) {
  User.get(id)
    .then(user => {
      req.user = user; // eslint-disable-line no-param-reassign
      return next();
    })
    .error(e => next(e));
}
function hashed(password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (hashErr, hash) => {
        if (hashErr) {
          reject(hashErr);
        }
        console.log(hash); //eslint-disable-line
        resolve(hash);
      });
    });
  });
}

function forgotPassword(req, res, next) {
  User.findOneAsync({ email: req.body.email })
    // eslint-disable-next-line
    .then(foundUser => {
      //eslint-disable-line
      if (foundUser) {
        const newPassword = Math.random()
          .toString(36)
          .substr(2, 6);
        hashed(newPassword).then(result => {
          const hashPassword = result;
          User.findOneAndUpdateAsync(
            { _id: foundUser._id },
            { $set: { password: hashPassword } }
          ) //eslint-disable-line
            // eslint-disable-next-line
            .then(updateUserObj => {
              //eslint-disable-line
              if (updateUserObj) {
                getConfig().then(data => {
                  if (data.email.onForgotPassword) {
                    const userObj = Object.assign(updateUserObj, {
                      newpass: newPassword
                    });
                    sendEmail(updateUserObj._id, userObj, "forgot"); //eslint-disable-line
                  }
                });
                const jwtAccessToken = jwt.sign(
                  updateUserObj.toJSON(),
                  config.jwtSecret
                );
                const returnObj = {
                  success: true,
                  message: "",
                  data: {}
                };
                returnObj.data.jwtAccessToken = `JWT ${jwtAccessToken}`;
                returnObj.data.user = updateUserObj;
                returnObj.message = "Check your Email Please";
                returnObj.success = true;
                return res.send(returnObj);
              }
            })
            .error(e => {
              const err = new APIError(
                `error in updating user details while login ${e}`,
                httpStatus.INTERNAL_SERVER_ERROR
              );
              return res.send(err);
            });
        });
      } else {
        const returnObj = {
          success: true,
          message: "",
          data: {}
        };
        returnObj.message = "No user exist with this email";
        returnObj.success = false;
        return res.send(returnObj);
      }
    })
    .error(e => next(e));
}

function addFollowing(req, res, next) {
  if (
    req.user.followings &&
    req.user.followings.indexOf(req.body.followingId) > 0
  ) {
    return res.send({
      success: false,
      data: "Provided User already being Followed"
    });
  }

  const notificationData = {
    userId: req.body.followingId,
    type: 'followed',
    link: req.user._id,
    toDisplayUser: req.user._id,
    date: Date.now()
  }

  User.findOneAndUpdate(
    { _id: req.user._id },
    { $push: { followings: req.body.followingId } }
  )
    .then(user => {
      User.findOneAndUpdate(
        { _id: req.body.followingId },
        { $push: { followers: user._id } }
      ).then(result => {
        notificationCtrl.createNotification('followed', notificationData);

        return res.send({
          success: true,
          message: "User Followed Successfully",
          data: {}
        })
      });
    })
    .catch(err => {
      return res.send({
        success: false,
        data: err
      });
    });
}

function removeFollowing(req, res, next) {
  if (
    req.user.followings &&
    req.user.followings.indexOf(req.body.followingId) < 0
  ) {
    return res.send({
      success: false,
      data: "Provided User is not being Followed"
    });
  }
  User.findOneAndUpdate(
    { _id: req.user._id },
    { $pull: { followings: req.body.followingId } },
    { multi: true }
  )
    .then(user => {
      User.findOneAndUpdate(
        { _id: req.body.followingId },
        { $pull: { followers: req.user._id } },
        { multi: true }
      ).then(result => {
        return res.send({
          success: true,
          message: "User Unfollowed",
          data: {}
        });
      });
    })
    .catch(err => {
      return res.send({
        success: false,
        message: "Failed To Unfollow User",
        data: err
      });
    });
}

function removeFollower(req, res, next) {
  if (
    req.user.followers &&
    req.user.followers.indexOf(req.body.followerId) < 0
  ) {
    return res.send({
      success: false,
      data: "Provided User is not your Follower"
    });
  }
  User.findOneAndUpdate(
    { _id: req.user._id },
    { $pull: { followers: req.body.followerId } },
    { multi: true }
  )
    .then(result => {
      return res.send({
        success: true,
        message: "User no longer your follower",
        data: {}
      });
    })
    .catch(err => {
      return res.send({
        success: false,
        message: "Failed To remove follower",
        data: err
      });
    });
}

function fetchMyProfileUsers(req, res, next) {
  req.id = req.user._id
  return next();
}

function fetchPersonUsers(req, res, next) {
  req.id = req.params.id
  return next();
}

function fetchFollowingsOrFollowers(req, res, next) {
  const type = _get(req.query, "query", "");
  const searchString = _get(req.query, "name");
  const pageNo = parseInt(_get(req.query, "pageNo", 1));
  const limit = parseInt(_get(req.query, "limit", 10));
  const skip = (pageNo - 1) * limit;
  const searchQuery = { "$regex": searchString, "$options": "i" };
  let cond = {};

  if (searchString) {
    cond = {
      ...cond, ...{
        $or: [
          { 'fname': searchQuery },
          { 'lname': searchQuery },
          { 'userName': searchQuery },
        ]
      }
    }
  }

  User.find({ _id: req.id })
    .populate(type, "fname lname userName profileUrl followers followings", cond)
    .select("fname lname")
    .then(user => {
      const result = _get(user[0], type, []).slice(skip, skip + limit);
      const pages =
        result.length < limit ? 1 : Math.ceil(result.length / limit);
      const totalCount = result.length;
      const obj = [{
        fname: _get(user[0], 'fname'),
        lname: _get(user[0], 'lname'),
        [type]: result
      }]
      return res.send({
        success: true,
        message: `List of ${type}`,
        data: {
          totalCount,
          pages,
          result: obj,
        }
      });
    })
    .catch(err => {
      return res.send({
        success: false,
        message: `Failed To Fetch ${type}`,
        data: err
      });
    });
}

function searchUser(req, res, next) {
  const searchString = _get(req.query, "q", "");
  const type = _get(req.query, "userType");
  const pageNo = parseInt(_get(req.query, "pageNo", 1));
  const limit = parseInt(_get(req.query, "limit", 10));
  const skip = (pageNo - 1) * limit;
  const searchQuery = { "$regex": searchString, "$options": "i" };

  let condition = [
    {
      $or: [
        { 'fname': searchQuery },
        { 'lname': searchQuery },
        { 'userName': searchQuery },
      ]
    },
    {
      userType: {
        $nin: ['admin', 'superAdmin']
      },
      _id: {
        $nin: [req.user._id]
      }
    }
  ];
  if (type) {
    condition = [...condition, { userType: type }];
  }

  User.find({ $and: condition }, null, {
    skip,
    limit
  })
    .select('fname lname userName followers followings profileUrl')
    .then(user => {
      if (!user.length) {
        return res.send({
          success: false,
          message: 'Users Not Found',
          data: user
        })
      }
      return res.send({
        success: true,
        message: "Found Users",
        data: user
      });
    })
    .catch(err => {
      return res.send({
        success: false,
        message: "Failed To Search User",
        data: err
      });
    });
}

function getUserDetails(req, res, next) {
  const id = req.params.id;

  User.findOne({ _id: id })
    .select('fname lname userName followers followings profileUrl')
    .then(user => {
      if (!user) {
        return res.send({
          success: false,
          message: 'User Not Found',
          data: user
        })
      }
      return res.send({
        success: true,
        message: "Found User",
        data: user
      });
    })
    .catch(err => {
      return res.send({
        success: false,
        message: "Failed To Fetch User",
        data: err
      });
    });
}

export default {
  load,
  get,
  create,
  update,
  remove,
  forgotPassword,
  upload,
  addFollowing,
  removeFollowing,
  removeFollower,
  fetchFollowingsOrFollowers,
  fetchMyProfileUsers,
  fetchPersonUsers,
  searchUser,
  getUserDetails
};
