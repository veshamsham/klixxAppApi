import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import config from "../../config/env";
import UserSchema from "../models/user";
import uuid from "uuid";

const debug = require("debug")("Taxi-app-backend-web-dashboard: admin-user");

function getAllUsers(req, res, next) {
  const limit = req.query.limit ? req.query.limit : config.limit;
  const pageNo = req.query.pageNo;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  const userType = req.query.userType;
  debug(`skip value: ${req.query.pageNo}`);
  UserSchema.countAsync({ userType })
    .then(totalUserRecord => {
      //eslint-disable-line
      const returnObj = {
        success: true,
        message: `no of ${userType}s are zero`, // `no of active drivers are ${returnObj.data.length}`;
        data: null,
        meta: {
          totalNoOfPages: Math.ceil(totalUserRecord / limit),
          limit,
          currPageNo: pageNo,
          currNoOfRecord: 20
        }
      };
      if (totalUserRecord < 1) {
        return res.send(returnObj);
      }
      if (skip > totalUserRecord) {
        const err = new APIError(
          "Request Page does not exists",
          httpStatus.NOT_FOUND
        );
        return next(err);
      }
      UserSchema.find({ userType })
        .limit(limit)
        .skip(skip)
        .then(userData => {
          returnObj.data = transformReturnObj(userData);
          returnObj.message = `${userType}s found`;
          returnObj.meta.currNoOfRecord = returnObj.data.length;
          debug(`no of records are ${returnObj.meta.currNoOfRecord}`);
          return res.send(returnObj);
        })
        .catch(err => {
          res.send("Error", err);
        });
    })
    .error(e => {
      const err = new APIError(
        `error occured while counting the no of users ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      debug("error inside getAllUsers records");
      next(err);
    });
}

function getTotalUsers(req, res) {
  // new users list
  UserSchema.find()
    .then(foundUser => {
      res.send(foundUser);
    })
    .catch(err => {
      res.send("Error", err);
    });
}

function getApprovePendingUsers(req, res, next) {
  const userType = req.query.userType;
  UserSchema.find({ $and: [{ userType }, { isApproved: "false" }] })
    .then(foundPendingUsers => {
      const returnObj = {
        success: false,
        message: `no of pending ${userType}s are zero`,
        data: null,
        meta: {
          totalRecords: 0
        }
      };
      returnObj.data = foundPendingUsers;
      if (returnObj.data.length > 0) {
        returnObj.success = true;
        returnObj.message = `no of pending users are ${returnObj.data.length}`;
        returnObj.meta.totalRecords = `${returnObj.data.length}`;
        res.send(returnObj);
      } else {
        res.send(returnObj);
      }
    })
    .catch(err => {
      next(err);
    });
}

function approveUser(req, res, next) {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
  const id = req.query.id;
  UserSchema.findOneAndUpdateAsync({ _id: id }, { $set: { isApproved: true } })
    .then(userUpdateData => {
      const returnObj = {
        success: false,
        message: "unable to update  user , user id provided didnt match ",
        data: null
      };
      returnObj.data = userUpdateData;
      console.log(returnObj, ">>>>>>>>>>>RETURNOBJECT<<<<<<<<<<<<<")
      if (returnObj.data) {
        returnObj.success = "true";
        returnObj.message = "user updated";
        res.send(returnObj);
      }
    })
    .catch(err => {
      console.log(err, '37645834658346583475634853648573');
      next(err);
    });
}

function rejectUser(req, res, next) {
  // findOneAndRemove
  const id = req.query.id;
  UserSchema.findOneAndRemoveAsync({ _id: id })
    .then(rejectUserData => {
      const returnObj = {
        success: false,
        message: "unable to delete  user , user id provided didnt match ",
        data: null
      };
      returnObj.data = rejectUserData;
      if (returnObj.data) {
        returnObj.success = "true";
        returnObj.message = "user deleted";
        res.send(returnObj);
      }
    })
    .catch(err => {
      next(err);
    });
}

function getActiveDriverDetails(req, res, next) {
  UserSchema.find({
    $and: [
      { userType: "driver" },
      { loginStatus: "true" },
      { isAvailable: "true" }
    ]
  })
    .then(foundActiveDrivers => {
      const returnObj = {
        success: false,
        message: "no of active drivers are zero",
        data: null,
        meta: {
          totalRecords: 0
        }
      };
      returnObj.data = foundActiveDrivers;
      if (returnObj.data.length > 0) {
        returnObj.success = "true";
        returnObj.message = `no of active drivers are ${returnObj.data.length}`;
        returnObj.meta.totalRecords = `${returnObj.data.length}`;
        res.send(returnObj);
      } else {
        returnObj.success = "false";
        returnObj.message = `no of active drivers are ${returnObj.data.length}`;
        returnObj.meta.totalRecords = `${returnObj.data.length}`;
        res.send(returnObj);
      }
    })
    .catch(err => {
      next(err);
    });
}

function getActiveCustomerDetails(req, res, next) {
  UserSchema.find({ $and: [{ userType: "rider" }, { loginStatus: "true" }] })
    .then(foundActiveCustomers => {
      const returnObj = {
        success: false,
        message: "no of active customers are zero",
        data: null,
        meta: {
          totalRecords: 0
        }
      };
      returnObj.data = foundActiveCustomers;
      if (returnObj.data.length > 0) {
        returnObj.success = "true";
        returnObj.message = `no of active customers are ${
          returnObj.data.length
          }`;
        returnObj.meta.totalRecords = `${returnObj.data.length}`;
        res.send(returnObj);
      }
    })
    .catch(err => {
      next(err);
    });
}

function getUsersDetails(req, res, next) {
  const userId = req.params.userId;
  const returnObj = {
    success: false,
    message: "user Id is not defined",
    data: null
  };
  if (userId) {
    UserSchema.findByIdAsync(userId)
      .then(userData => {
        if (userData) {
          returnObj.success = true;
          returnObj.message = "user found and its corresponding details";
          returnObj.data = userData;
        } else {
          returnObj.success = false;
          returnObj.message = "user not found with the given id";
          returnObj.data = null;
        }
        res.send(returnObj);
      })
      .error(e => {
        const err = new APIError(
          `Error occured while findind the user details ${e}`,
          httpStatus.INTERNAL_SERVER_ERROR
        );
        next(err);
      });
  } else {
    res.send(returnObj);
  }
}

function updateUserDetails(req, res, next) {
  const userId = req.body._id; //eslint-disable-line
  const updateUserObj = Object.assign({}, req.body);
  UserSchema.findOneAsync({ _id: userId })
    .then(userDoc => {
      if (userDoc) {
        userDoc.fname = updateUserObj.fname
          ? updateUserObj.fname
          : userDoc.fname;
        userDoc.lname = updateUserObj.lname
          ? updateUserObj.lname
          : userDoc.lname;
        userDoc.phoneNo = updateUserObj.phoneNo
          ? updateUserObj.phoneNo
          : userDoc.phoneNo;
        userDoc.address = updateUserObj.address
          ? updateUserObj.address
          : userDoc.address;
        userDoc.city = updateUserObj.city ? updateUserObj.city : userDoc.city;
        userDoc.state = updateUserObj.state
          ? updateUserObj.state
          : userDoc.state;
        userDoc.country = updateUserObj.country
          ? updateUserObj.country
          : userDoc.country;
        const returnObj = {
          success: false,
          message: "unable to find the object",
          data: null,
          meta: null
        };

        userDoc
          .saveAsync()
          .then(savedDoc => {
            if (savedDoc.password) {
              debug("inside password delete function");
              savedDoc = savedDoc.toObject();
              delete savedDoc.password;
            }
            returnObj.success = true;
            returnObj.message = "user document saved";
            returnObj.data = savedDoc;
            res.send(returnObj);
          })
          .error(e => {
            const err = new APIError(
              `Error occured while updating the user details ${e}`,
              httpStatus.INTERNAL_SERVER_ERROR
            );
            next(err);
          });
      }
    })
    .error(e => {
      const err = new APIError(
        `Error occured while searching for the user ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

function userStats(req, res, next) {
  const returnObj = {
    success: false,
    message: "no data available",
    data: null
  };
  UserSchema.aggregateAsync([
    { $match: { $or: [{ userType: "driver" }, { userType: "rider" }] } },
    {
      $group: {
        _id: "riderDriverRatio",
        rider: { $sum: { $cond: [{ $eq: ["$userType", "rider"] }, 1, 0] } },
        driver: { $sum: { $cond: [{ $eq: ["$userType", "driver"] }, 1, 0] } },
        totalUser: { $sum: 1 }
      }
    }
  ])
    .then(userStatsData => {
      returnObj.success = true;
      returnObj.message = "user chart data";
      returnObj.data = userStatsData;
      return res.send(returnObj);
    })
    .error(e => {
      const err = new APIError(
        `Error occurred while computing statistic for user ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

// this function removes carDetails from the rider object and for driver object add car details a object
function transformReturnObj(userData) {
  for (let i = 0; i < userData.length; i++) {
    //eslint-disable-line
    if (userData[i].userType === "rider" && userData[i].carDetails) {
      delete userData[i].carDetails;
    }
  }
  return userData;
}

function changePassword(req, res, next) {
  const userObj = {
    email: req.body.email,
    userType: req.body.userType
  };
  UserSchema.findOneAsync(userObj, "+password")
    .then(user => {
      //eslint-disable-line
      const returnObj = {
        success: false,
        message: "",
        data: null
      };
      if (!user) {
        const err = new APIError(
          "User not found with the given email id",
          httpStatus.NOT_FOUND
        );
        return next(err);
      } else {
        user.comparePassword(req.body.oldpassword, (passwordError, isMatch) => {
          //eslint-disable-line
          if (passwordError || !isMatch) {
            const err = new APIError(
              "Incorrect old password",
              httpStatus.UNAUTHORIZED
            );
            return next(err);
          }
          user.password = req.body.password;
          user
            .saveAsync()
            .then(savedUser => {
              returnObj.success = true;
              returnObj.message = "password changed  successfully";
              returnObj.data = savedUser;
              return res.send(returnObj);
            })
            .error(e => {
              const err = new APIError(
                `Error while changing password ${e}`,
                httpStatus.INTERNAL_SERVER_ERROR
              );
              returnObj.success = false;
              returnObj.message = "password not changed";
              console.log(err);
              return next(returnObj);
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

function createNewUser(req, res, next) {
  const userData = Object.assign({}, req.body);
  UserSchema.findOneAsync({
    email: userData.email,
    userType: userData.userType
  })
    .then(foundUser => {
      //eslint-disable-line
      const returnObj = {
        success: false,
        message: "",
        data: null
      };
      if (foundUser !== null) {
        const err = new APIError("Email Id Already Exist", httpStatus.CONFLICT);
        return next(err);
      }
      const userObj = new UserSchema({
        email: userData.email,
        password: userData.password ? userData.password : "abcdefgh",
        userType: userData.userType,
        fname: userData.fname,
        lname: userData.lname,
        dob: userData.dob,
        phoneNo: userData.phoneNo,
        userName: uuid(),
        bloodGroup: userData.bloodGroup ? userData.bloodGroup : null,
        gpsLoc: [77.85368273308545, 12.02172902354515],
        emergencyDetails:
          userData.userType === "rider"
            ? {
              phone: userData.emergencyDetails.phone
                ? userData.emergencyDetails.phone
                : "",
              name: userData.emergencyDetails.name
                ? userData.emergencyDetails.name
                : "",
              imgUrl: null
            }
            : {
              phone: "",
              name: "",
              imgUrl: null
            },
        carDetails:
          userData.userType === "driver"
            ? {
              type: userData.carDetails.type
                ? userData.carDetails.type
                : "Sedan",
              company: userData.carDetails.company
                ? userData.carDetails.company
                : "Maruti",
              regNo: userData.carDetails.regNo
                ? userData.carDetails.regNo
                : "",
              RC_ownerName: userData.carDetails.RC_ownerName
                ? userData.carDetails.RC_ownerName
                : "",
              vehicleNo: userData.carDetails.vehicleNo
                ? userData.carDetails.vehicleNo
                : "",
              carModel: userData.carDetails.carModel
                ? userData.carDetails.carModel
                : "",
              regDate: userData.carDetails.regDate
                ? userData.carDetails.regDate
                : ""
            }
            : {},
        insuranceUrl:
          userData.userType === "driver"
            ? userData.vehicleDocuments.insuranceUrl
            : null,
        rcBookUrl:
          userData.userType === "driver"
            ? userData.vehicleDocuments.rcBookUrl
            : null,
        licenceUrl:
          userData.userType === "driver"
            ? userData.licenceDocuments.licenceUrl
            : null,
        vechilePaperUrl:
          userData.userType === "driver"
            ? userData.licenceDocuments.vechilePaperUrl
            : null,
        licenceDetails:
          userData.userType === "driver"
            ? {
              licenceNo: userData.licenceDetails.licenceNo
                ? userData.licenceDetails.licenceNo
                : null,
              issueDate: userData.licenceDetails.issueDate
                ? userData.licenceDetails.issueDate
                : null,
              expDate: userData.licenceDetails.expDate
                ? userData.licenceDetails.expDate
                : null
            }
            : {},
        bankDetails:
          userData.userType === "driver"
            ? {
              accountNo: userData.bankDetails.accountNo
                ? userData.bankDetails.accountNo
                : null,
              holderName: userData.bankDetails.holderName
                ? userData.bankDetails.holderName
                : "",
              IFSC: userData.bankDetails.IFSC ? userData.bankDetails.IFSC : ""
            }
            : {},
        mapCoordinates: [0, 0],
        loginStatus: true
      });
      userObj
        .saveAsync()
        .then(savedUser => {
          returnObj.success = true;
          returnObj.message = "user created successfully";
          returnObj.data = savedUser;
          return res.send(returnObj);
        })
        .error(e => {
          const err = new APIError(
            `Error while Creating new User ${e}`,
            httpStatus.INTERNAL_SERVER_ERROR
          );
          returnObj.success = false;
          returnObj.message = "user not created";
          console.log(err);
          return next(returnObj);
        });
    })
    .error(e => {
      const err = new APIError(
        `Error while Searching the user ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      return next(err);
    });
}

export default {
  rejectUser,
  approveUser,
  getApprovePendingUsers,
  getAllUsers,
  getUsersDetails,
  updateUserDetails,
  userStats,
  createNewUser,
  getTotalUsers,
  getActiveDriverDetails,
  getActiveCustomerDetails,
  changePassword
};
