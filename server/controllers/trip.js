import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";
import { get } from "lodash";
import formidable from "formidable";
import APIError from "../helpers/APIError";
import { fetchReturnObj } from "../service/transform-response";
import TripSchema from "../models/trip";
import config from "../../config/env";
import ServerConfig from "../models/serverConfig";

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */

function getHistory(req, res, next) {
  const historyObjArray = [];
  const userID = req.user._id; //eslint-disable-line
  const userType = req.user.userType;
  const searchObj = {};
  if (userType === "rider") {
    searchObj.riderId = userID;
  } else if (userType === "driver") {
    searchObj.driverId = userID;
  }
  TripSchema.find(
    { $and: [searchObj, { tripStatus: "endTrip" }] },
    null,
    { sort: { bookingTime: -1 } },
    (tripErr, tripObj) => {
      //eslint-disable-line
      if (tripErr) {
        const err = new APIError(
          `error while finding trip history for the user  ${tripErr}`,
          httpStatus.INTERNAL_SERVER_ERROR
        );
        return next(err);
      }
      if (tripObj.length !== 0) {
        tripObj.forEach((obj, index) => {
          fetchReturnObj(obj).then(transformedReturnObj => {
            historyObjArray.push(transformedReturnObj);
            if (index === tripObj.length - 1) {
              const returnObj = {
                success: true,
                message: "user trip history",
                data: historyObjArray
              };
              res.send(returnObj);
            }
          });
        });
      } else {
        const returnObj = {
          success: true,
          message: "no history available",
          data: []
        };
        res.send(returnObj);
      }
    }
  );
}

/**
 * Get getCloudinaryDetails
 * @returns {Cloudinary Details}

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
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { tripObj }
 */

function updateTrip(req, res, next) {
  console.log(req, "reqreqreqreq");
  //eslint-disable-line
  const userType = req.user.userType;
  getCloudinaryDetails()
    .then(value => {
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
          const img = get(files, "image.path", "");
          const tripID = fields.tripId;
          cloudinary.v2.uploader.upload(
            img,
            // {
            //   transformation: [
            //     {
            //       effect: 'improve',
            //       gravity: 'face',
            //       height: 100,
            //       width: 100,
            //       crop: 'fill',
            //     },
            //     { quality: 'auto' },
            //   ],
            // },
            (error, results) => {
              if (results) {
                TripSchema.findOneAndUpdateAsync(
                  { _id: fields.tripId },
                  { $set: { receiptUrl: results.url } },
                  { new: 1, runValidators: true }
                )
                  .then(updatedTripObj => {
                    //eslint-disable-line
                    const returnObj = {
                      success: false,
                      message:
                        "unable to update trip object as trip id provided didnt match",
                      data: null,
                      meta: null
                    };
                    if (updatedTripObj) {
                      returnObj.success = true;
                      returnObj.message = "trip object updated";
                      returnObj.data = updatedTripObj;
                      res.send(returnObj);
                    } else {
                      const err = new APIError(
                        "Trip Id did not matched",
                        httpStatus.BAD_REQUEST
                      );
                      return next(err);
                    }
                  })
                  .error(e => {
                    const err = new APIError(
                      `Error occured while updatating trip object ${e}`,
                      httpStatus.INTERNAL_SERVER_ERROR
                    );
                    next(err);
                  });
              }
            }
          );
        });
      }
    })
    .catch(e => {
      const err = new APIError(
        `Error occured while updatating trip object ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

export default { getHistory, updateTrip };
