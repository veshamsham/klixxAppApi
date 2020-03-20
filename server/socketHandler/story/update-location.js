import gpsDistannce from "gps-distance";
import config from "../../../config/env";
import { fetchReturnObj } from "../../service/transform-response";
import sendNotification from "../../service/pushNotification";
import SocketStore from "../../service/socket-store.js"; //eslint-disable-line
import TripRequestSchema from "../../models/trip-request";
import TripSchema from "../../models/trip";
import UserSchema from "../../models/user";

/**
 * updateLocation handler, handle location update of the rider or driver
 * @param socket object
 * @returns {*}
 */
/* eslint-disable */

function updateLocationHandler(socket) {
  /**
   * updateLocation event is fired by rider or driver whenever their location is changed. also it send location update to corresponding rider or driver if they are in any tripRequest or trip.
   * @param userObj - user whose location has to be updated
   * @returns emit an updateDriverLocation or updateRiderLocation event based on userType.
   */

  socket.on("updateLocation", userObj => {
    const userType = userObj.userType;
    let searchObj = {};
    if (userType === "1") {
      searchObj = {
        riderId: userObj._id
      };
    } else if (userType === "2") {
      searchObj = {
        driverId: userObj._id
      };
    }
    // console.log(userType);
    const userID = userObj._id;
    console.log(userID)
    UserSchema.findOneAndUpdateAsync(
      { _id: userID },
      { $set: { gpsLoc: userObj.gpsLoc } },
      { new: true }
    )
      .then(updatedUser => {
        // console.log(updatedUser+" this is done")
        SocketStore.emitByUserId(userID, "locationUpdated", updatedUser);
        TripRequestSchema.findOneAsync({
          $and: [
            searchObj,
            {
              $or: [
                { tripRequestStatus: "enRoute" },
                { tripRequestStatus: "arriving" },
                { tripRequestStatus: "arrived" }
              ]
            }
          ]
        })
          .then(tripRequestObj => {
            if (tripRequestObj) {
              
              if (userType === "1") {
               
                SocketStore.emitByUserId(
                  tripRequestObj.riderId,
                  "updateDriverLocation",
                  updatedUser.gpsLoc
                );
                SocketStore.emitByUserId(
                  "59428b1bb0c3cc0f554fd52a",
                  "getDriverDetails",
                  updatedUser.gpsLoc
                );
                const driverObj = updatedUser;
                changedTripRequestStatus(driverObj, tripRequestObj);
              } else if (userType === "2") {
                SocketStore.emitByUserId(
                  tripRequestObj.driverId,
                  "updateRiderLocation",
                  updatedUser.gpsLoc
                );
              }
            } else {
              TripSchema.findOneAsync({
                $and: [searchObj, { tripStatus: "onTrip" }]
              })
                .then(tripObj => {
                  if (tripObj) {
                    if (userType === "1") {
                      SocketStore.emitByUserId(
                        tripObj.riderId,
                        "updateDriverLocation",
                        updatedUser.gpsLoc
                      );
                      SocketStore.emitByUserId(
                        "59428b1bb0c3cc0f554fd52a",
                        "getDriverDetails",
                        updatedUser.gpsLoc
                      );
                    } else if (userType === "2") {
                      SocketStore.emitByUserId(
                        tripObj.driverId,
                        "updateRiderLocation",
                        updatedUser.gpsLoc
                      );
                    }
                  } else {
                    // no corresponding rider or driver found to emit the update location
                  }
                })
                .error(e => {
                  SocketStore.emitByUserId(userID, "socketError", e);
                });
            }
          })
          .error(e => {
            SocketStore.emitByUserId(userID, "socketError", e);
          });
      })
      .error(e => {
        SocketStore.emitByUserId(userID, "socketError", e);
      });
  });
}

function changedTripRequestStatus(driverObj, tripRequestObj) {
  let dist = gpsDistannce(
    driverObj.gpsLoc[1],
    driverObj.gpsLoc[0],
    tripRequestObj.srcLoc[1],
    tripRequestObj.srcLoc[0]
  );
  let newTripRequestStatus = null;
  const currentTripRequestStatus = tripRequestObj.tripRequestStatus;
  dist = dist.toFixed(4) * 1000; // dist in meters
  console.log("gps location driver", driverObj.gpsLoc);
  console.log("distance %%%%%%%%", dist);
  if (dist <= config.arrivedDistance) {
    newTripRequestStatus = "arrived";
  } else if (dist > config.arrivedDistance && dist < config.arrivingDistance) {
    newTripRequestStatus = "arriving";
  } else {
    newTripRequestStatus = "enRoute";
  }
  if (newTripRequestStatus !== currentTripRequestStatus) {
    tripRequestObj.tripRequestStatus = newTripRequestStatus;
    TripRequestSchema.findOneAndUpdateAsync(
      { _id: tripRequestObj._id },
      { $set: tripRequestObj },
      { new: true }
    )
      .then(updatedTripRequestObj => {
        fetchReturnObj(updatedTripRequestObj).then(updatedTripRequestObj123 => {
          if (updatedTripRequestObj123.tripRequestStatus === "arrived") {
            sendNotification(
              updatedTripRequestObj.riderId,
              `Driver has ${updatedTripRequestObj123.tripRequestStatus}`
            );
            sendNotification(
              updatedTripRequestObj.driverId,
              updatedTripRequestObj123.tripRequestStatus
            );
          } else {
            sendNotification(
              updatedTripRequestObj.riderId,
              `Driver is ${updatedTripRequestObj123.tripRequestStatus}`
            );
            sendNotification(
              updatedTripRequestObj.driverId,
              updatedTripRequestObj123.tripRequestStatus
            );
          }
          SocketStore.emitByUserId(
            updatedTripRequestObj.riderId,
            "tripRequestUpdated",
            updatedTripRequestObj123
          );
          SocketStore.emitByUserId(
            updatedTripRequestObj.driverId,
            "tripRequestUpdated",
            updatedTripRequestObj123
          );
        });
      })
      .error(err => {
        SocketStore.emitByUserId(tripRequestObj.riderId, "socketError", {
          message: "error while updating tripRequestStatus based on distance",
          data: err
        });
        SocketStore.emitByUserId(tripRequestObj.driverId, "socketError", {
          message: "error while updating tripRequestStatus based on distance",
          data: err
        });
      });
  }
}

export default updateLocationHandler;
