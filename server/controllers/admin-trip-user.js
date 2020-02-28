import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import config from '../../config/env';
import TripRequestSchema from '../models/trip-request';
import { transformReturnObj } from '../service/transform-return-object';
import UserSchema from '../models/user';

const debug = require('debug')('Taxi-app-backend-web-dashboard: admin-trip-user');

function userTripDetails(req, res, next) {
  const userId = req.params.userId;
  debug(`user id ${userId}`);
  debug(`limit value ${req.query.limit}`);
  const limit = req.query.limit ? req.query.limit : config.limit;
  const pageNo = req.query.pageNo ? req.query.pageNo : 1;
  const skip = pageNo ? (pageNo - 1) * limit : config.skip;
  UserSchema.findByIdAsync(userId)
    .then((userObject) => { //eslint-disable-line
      const returnObj = {
        success: false,
        message: 'user not found with the given id',
        data: [],
        meta: {
          totalNoOfPages: null,
          limit,
          currPageNo: pageNo,
          totalRecords: null
        }
      };
      if (userObject === null || userObject === undefined) {
        return res.send(returnObj);
      }
      const userType = userObject.userType;
      TripRequestSchema.getUserCount(userType, userId)
        .then((totalUserTripRequestRecords) => { //eslint-disable-line
          returnObj.meta.totalNoOfPages = Math.ceil(totalUserTripRequestRecords / limit);
          returnObj.meta.totalRecords = totalUserTripRequestRecords;

          if (totalUserTripRequestRecords < 1) {
            returnObj.success = true;
            returnObj.message = 'user has zero trip Request records';
            return res.send(returnObj);
          }
          if (skip > totalUserTripRequestRecords) {
            const err = new APIError('Request Page No does not exists', httpStatus.NOT_FOUND);
            return next(err);
          }

          TripRequestSchema.userList({
            skip, limit, userId, userType
          })
            .then((userTripRequestData) => {
              for (let i = 0; i < userTripRequestData.length; i++) { //eslint-disable-line
                userTripRequestData[i] = transformReturnObj(userTripRequestData[i]);
              }
              returnObj.success = true;
              returnObj.message = 'user trip request records';
              returnObj.data = userTripRequestData;
              res.send(returnObj);
            })
            .error((e) => {
              const err = new APIError(
                `Error occured while fetching user trip Request records ${e}`,
                httpStatus.INTERNAL_SERVER_ERROR
              );
              next(err);
            });
        })
        .error((e) => {
          const err = new APIError(
            `Error occured counting user trip request records ${e}`,
            httpStatus.INTERNAL_SERVER_ERROR
          );
          next(err);
        });
    })
    .error((e) => {
      const err = new APIError(
        `Error occured searching for user object ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

function userTripRequestStatics(req, res, next) {
  const userId = req.params.userId;
  debug(`user id ${userId}`);
  debug(`limit value ${req.query.limit}`);
  const limit = req.query.limit ? req.query.limit : config.limit;
  const pageNo = req.query.pageNo;
  UserSchema.findByIdAsync(userId)
    .then((userObject) => { //eslint-disable-line
      const returnObj = {
        success: false,
        message: 'user not found with the given id',
        data: null,
        meta: {
          totalNoOfPages: null,
          limit,
          currPageNo: pageNo,
          totalRecords: null
        }
      };
      if (userObject === null || userObject === undefined) {
        return res.send(returnObj);
      }
      const userType = userObject.userType;
      let searchObj = {};
      let groupBy = null;
      if (userType === 'rider') {
        searchObj = {};
        groupBy = 'riderId';
        searchObj.riderId = userObject._id; //eslint-disable-line
      }
      if (userType === 'driver') {
        groupBy = 'driverId';
        searchObj = {};
        searchObj.driverId = userObject._id; //eslint-disable-line
      }
      TripRequestSchema.aggregateAsync([
        { $match: searchObj },
        {
          $group: {
            _id: `$${groupBy}`,
            completed: { $sum: { $cond: [{ $eq: ['$tripRequestStatus', 'completed'] }, 1, 0] } },
            inQueue: {
              $sum: {
                $cond: [
                  {
                    $anyElementTrue: {
                      $map: {
                        input: ['enRoute', 'arriving', 'arrived', 'request'],
                        as: 'status',
                        in: { $eq: ['$$status', '$tripRequestStatus'] }
                      }
                    }
                  },
                  1,
                  0
                ]
              }
            },
            cancelled: { $sum: { $cond: [{ $or: [{ $eq: ['$tripRequestStatus', 'cancelled'] }, { $eq: ['$tripRequestStatus', 'rejected'] }] }, 1, 0] } },
            totalRequest: { $sum: 1 },
          }
        },
      ])
        .then((chartStats) => {
          returnObj.success = true;
          returnObj.message = 'user trip request statistic';
          returnObj.data = chartStats;
          res.send(returnObj);
        })
        .error((e) => {
          const err = new APIError(
            `Error occured while grouping the _id ${e}`,
            httpStatus.INTERNAL_SERVER_ERROR
          );
          next(err);
        });
    })
    .error((e) => {
      const err = new APIError(
        `Error occured searching for user object ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}
export default { userTripDetails, userTripRequestStatics };
