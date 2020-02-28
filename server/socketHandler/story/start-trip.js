/* eslint-disable */
import moment from "moment";
import "whatwg-fetch";
import gpsDistannce from "gps-distance";
import SocketStore from "../../service/socket-store.js"; //eslint-disable-line
import { fetchReturnObj } from "../../service/transform-response";
import AppConfig from "../../models/appConfig";
import paymentCtrl from "../../controllers/payment"; //eslint-disable-line
import sendEmail from "../../service/emailApi";
import sendNotification from "../../service/pushNotification";
import sendSms from "../../service/smsApi";
import TripRequest from "../../models/trip-request";
import TripSchema from "../../models/trip";
import UserSchema from "../../models/user.js"; //eslint-disable-line
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
/**
 * startTriphandler function create a new trip object which stores the different details related to trip.
 * @param socket object
 * @returns {*}
 */
const startTripHandler = socket => {
  /**
   * startTrip event is emitted by driver when trip get started
   * @param tripRequest object
   * @param callback function
   * @return send tripUpdated event to the rider with all the information related to trip
   */
  socket.on("startTrip", (tripRequestObj, cb) => {
    console.log("start trip called in apiserver------------>");
    const riderID = tripRequestObj.riderId;
    const driverID = tripRequestObj.driverId;
    tripRequestObj.tripRequestStatus = "completed";
    const tripObj = new TripSchema({
      riderId: tripRequestObj.riderId,
      driverId: tripRequestObj.driverId,
      srcLoc: tripRequestObj.srcLoc,
      destLoc: tripRequestObj.destLoc,
      pickUpAddress: tripRequestObj.pickUpAddress,
      destAddress: tripRequestObj.destAddress,
      paymentMode: tripRequestObj.paymentMode
    });
    tripObj
      .saveAsync()
      .then(savedTrip => {
        tripRequestObj.tripId = savedTrip._id;
        TripRequest.findOneAndUpdateAsync(
          { _id: tripRequestObj._id },
          { $set: tripRequestObj }
        ).error(e => {
          SocketStore.emitByUserId(riderID, "socketError", e);
          SocketStore.emitByUserId(driverID, "socketError", e);
        });
        UserSchema.updateAsync(
          { $or: [{ _id: savedTrip.riderId }, { _id: savedTrip.driverId }] },
          { $set: { currTripId: savedTrip._id, currTripState: "trip" } },
          { new: true, multi: true }
        )
          .then(() => {
            fetchReturnObj(savedTrip).then(returnObj => {
              sendNotification(riderID, "Driver has started trip");
              SocketStore.emitByUserId(riderID, "tripUpdated", returnObj);
              cb(returnObj);
            });
          })
          .error(e => {
            SocketStore.emitByUserId(savedTrip.riderId, "socketError", {
              message: "error while updating currTripId of user to start Trip",
              data: e
            });
            SocketStore.emitByUserId(savedTrip.driverId, "socketError", {
              message: "error while updating currTripId of user to start Trip",
              data: e
            });
          });
      })
      .error(e => {
        cb(null);
        console.log("some error occured inside the socket Error");
        SocketStore.emitByUserId(riderID, "socketError", e);
        SocketStore.emitByUserId(driverID, "socketError", e);
      });
  });

  /**
   * tripUpdate emit is fired when rider or driver make any changes to trip Object
   * @param trip object
   * @return send tripUpdated event to the rider and driver with all the information related to trip
   */

  socket.on("tripUpdate", tripObj => {
    const riderID = tripObj.riderId;
    const driverID = tripObj.driverId;
    if (
      tripObj.tripStatus === "endTrip" &&
      tripObj.riderRatingByDriver === 0 &&
      tripObj.driverRatingByRider === 0
    ) {
      const then = moment(tripObj.bookingTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ");
      const now = moment(new Date());
      tripObj.travelTime = moment.duration(then.diff(now));
      tripObj.tripDist = gpsDistannce(
        tripObj.srcLoc[1],
        tripObj.srcLoc[0],
        tripObj.destLoc[1],
        tripObj.destLoc[0]
      );
      if (tripObj.travelTime < 0) {
        tripObj.travelTime = Math.abs(tripObj.travelTime);
      }
      UserSchema.updateAsync(
        { $or: [{ _id: tripObj.riderId }, { _id: tripObj.driverId }] },
        { $set: { currTripId: null, currTripState: null } },
        { new: true, multi: true }
      )
        .then(() => {
          // updated user records
          getConfig().then(data => {
            if (data.email.onEndTripRider) {
              // sendEmail(tripObj.riderId, tripObj, "endTrip");
            }
            if (data.email.onEndTripDriver) {
              // sendEmail(tripObj.driverId, tripObj, "endTrip");
            }
            if (data.sms.onEndTripRider) {
              // sendSms(tripObj.riderId, "You have reached the Destination");
            }
            if (data.sms.onEndTripDriver) {
              // sendSms(tripObj.driverId, "You have drop the Rider ");
            }
          });
        })
        .error(e => {
          SocketStore.emitByUserId(tripObj.riderId, "socketError", {
            message:
              "error while updating currTripId of user to null when Trip ends",
            data: e
          });
          SocketStore.emitByUserId(tripObj.driverId, "socketError", {
            message:
              "error while updating currTripId of user to null Trip ends",
            data: e
          });
        });
    }
    if (
      tripObj.riderRatingByDriver !== 0 ||
      tripObj.driverRatingByRider !== 0
    ) {
      updateUserRating(tripObj);
    } else if (tripObj.paymentMode === "CARD") {
      paymentCtrl.cardPayment(tripObj).then(status => {
        tripObj.paymentStatus = status;
        TripSchema.findOneAndUpdateAsync(
          { _id: tripObj._id },
          { $set: tripObj },
          { new: true }
        )
          .then(updatedTripObject => {
            fetchReturnObj(updatedTripObject).then(updatedTripObj => {
              SocketStore.emitByUserId(riderID, "tripUpdated", updatedTripObj);
              SocketStore.emitByUserId(driverID, "tripUpdated", updatedTripObj);
            });
          })
          .error(e => {
            SocketStore.emitByUserId(riderID, "socketError", e);
            SocketStore.emitByUserId(driverID, "socketError", e);
          });
      });
    } else {
      TripSchema.findOneAndUpdateAsync(
        { _id: tripObj._id },
        { $set: tripObj },
        { new: true }
      )
        .then(updatedTripObject => {
          fetchReturnObj(updatedTripObject).then(updatedTripObj => {
            SocketStore.emitByUserId(riderID, "tripUpdated", updatedTripObj);
            SocketStore.emitByUserId(driverID, "tripUpdated", updatedTripObj);
          });
        })
        .error(e => {
          SocketStore.emitByUserId(riderID, "socketError", e);
          SocketStore.emitByUserId(driverID, "socketError", e);
        });
    }
  });
};

function updateUserRating(tripObj) {
  if (tripObj.riderRatingByDriver !== 0) {
    TripSchema.findOneAndUpdateAsync(
      { _id: tripObj._id },
      { $set: { riderRatingByDriver: tripObj.riderRatingByDriver } },
      { new: true }
    )
      .then(updatedTripObj => {
        TripSchema.aggregateAsync([
          {
            $match: {
              riderId: updatedTripObj.riderId,
              tripStatus: "endTrip",
              riderRatingByDriver: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: "$riderId",
              userRt: { $avg: "$riderRatingByDriver" }
            }
          }
        ])
          .then(res => {
            if (res.length !== 0) {
              UserSchema.findOneAndUpdateAsync(
                { _id: res[0]._id },
                { $set: { userRating: res[0].userRt.toFixed(2) } },
                { new: true }
              ).error(e => {
                SocketStore.emitByUserId(tripObj.riderId, "socketError", e);
                SocketStore.emitByUserId(tripObj.driverId, "socketError", e);
              });
            }
          })
          .error(e => {
            SocketStore.emitByUserId(tripObj.riderId, "socketError", e);
            SocketStore.emitByUserId(tripObj.driverId, "socketError", e);
          });
      })
      .error(e => {
        SocketStore.emitByUserId(tripObj.riderId, "socketError", e);
        SocketStore.emitByUserId(tripObj.driverId, "socketError", e);
      });
  }

  if (tripObj.driverRatingByRider !== 0) {
    TripSchema.findOneAndUpdateAsync(
      { _id: tripObj._id },
      {
        $set: {
          driverRatingByRider: tripObj.driverRatingByRider,
          driverReviewByRider: tripObj.driverReviewByRider
        }
      },
      { new: true }
    )
      .then(updatedTripObj => {
        TripSchema.aggregateAsync([
          {
            $match: {
              driverId: updatedTripObj.driverId,
              tripStatus: "endTrip",
              driverRatingByRider: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: "$driverId",
              userRt: { $avg: "$driverRatingByRider" }
            }
          }
        ])
          .then(res => {
            if (res.length !== 0) {
              UserSchema.findOneAndUpdateAsync(
                { _id: res[0]._id },
                { $set: { userRating: res[0].userRt.toFixed(2) } },
                { new: true }
              ).error(e => {
                SocketStore.emitByUserId(tripObj.riderId, "socketError", e);
                SocketStore.emitByUserId(tripObj.driverId, "socketError", e);
              });
            }
          })
          .error(e => {
            SocketStore.emitByUserId(tripObj.riderId, "socketError", e);
            SocketStore.emitByUserId(tripObj.driverId, "socketError", e);
          });
      })
      .error(e => {
        SocketStore.emitByUserId(tripObj.riderId, "socketError", e);
        SocketStore.emitByUserId(tripObj.driverId, "socketError", e);
      });
  }
}
export default startTripHandler;
