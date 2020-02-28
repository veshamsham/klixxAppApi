/* eslint-disable */
import deferred from "deferred";
import Promise from "bluebird";
import httpStatus from "http-status";
import APIError from "../../helpers/APIError";
import AppConfig from "../../models/appConfig";
import config from "../../../config/env";
import { fetchReturnObj } from "../../service/transform-response";
import sendEmail from "../../service/emailApi";
import SendNotification from "../../service/pushNotification";
import sendSms from "../../service/smsApi";
import SocketStore from "../../service/socket-store.js"; //eslint-disable-line
import TripRequest from "../../models/trip-request";
import UserSchema from "../../models/user";

const watchIdObj = {};
const promObj = {};
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

function requestTripHandler(socket) {
  socket.on("requestTrip", payload => {
    const quantum = 10;
    const riderID = payload.rider._id;
    nearByDriver(riderID)
      .then(nearByDriversDoc => {
        // console.log(nearByDriversDoc, 'nearby user');
        for (let i = 0; i < nearByDriversDoc.length - 1; i++) {
          if (!checkSocketConnection(nearByDriversDoc[i]._id)) {
            nearByDriversDoc = removeDriverFromList(nearByDriversDoc, i);
          }
        }
        roundRobinAsync(nearByDriversDoc, quantum, payload)
          .then(result => {
            console.log(result, "result round robin");
            if (result === false) {
              payload.tripRequest.tripRequestStatus = "noNearByDriver";
              SendNotification(riderID, "No nearby drivers");
              SocketStore.emitByUserId(
                payload.rider._id,
                "tripRequestUpdated",
                payload.tripRequest
              );
            }
          })
          .catch(e => console.log("error", e));
      })
      .catch(e => console.log("error", e));
  });
  socket.on("requestDriverResponse", tripRequest => {
    clearInterval(watchIdObj[tripRequest._id]);
    const driverId = tripRequest.driver._id;
    promObj[driverId].resolve(tripRequest); // or resolve promise
  });
  socket.on("tripRequestUpdate", payload => {
    TripRequest.findOneAndUpdateAsync(
      { _id: payload._id },
      { $set: payload },
      { new: true }
    )
      .then(updatedTripRequestObject => {
        if (updatedTripRequestObject.tripRequestStatus === "cancelled") {
          UserSchema.updateAsync(
            { $or: [{ _id: payload.riderId }, { _id: payload.driverId }] },
            { $set: { currTripId: null, currTripState: null } },
            { new: true, multi: true }
          )
            .then(() => {
              // updated user records
            })
            .error(e => {
              SocketStore.emitByUserId(payload.riderId, "socketError", {
                message:
                  "error while updating curTripId  to null in requestDriverResponse",
                data: e
              });
              SocketStore.emitByUserId(payload.driverId, "socketError", {
                message:
                  "error while updating curTripId to null in requestDriverResponse",
                data: e
              });
            });
        }
        fetchReturnObj(updatedTripRequestObject).then(updatedTripRequestObj => {
          if (
            socket.userId.toString() ===
            updatedTripRequestObj.riderId.toString()
          ) {
            console.log(
              "updatedTripRequestObj.riderId",
              updatedTripRequestObj.riderId
            );
            SendNotification(
              updatedTripRequestObj.riderId,
              updatedTripRequestObj.tripRequestStatus
            );
            SendNotification(
              updatedTripRequestObj.driver,
              updatedTripRequestObj.tripRequestStatus
            );
            SocketStore.emitByUserId(
              updatedTripRequestObj.driverId,
              "tripRequestUpdated",
              updatedTripRequestObj
            );
          } else if (
            socket.userId.toString() ===
            updatedTripRequestObj.driverId.toString()
          ) {
            SocketStore.emitByUserId(
              updatedTripRequestObj.riderId,
              "tripRequestUpdated",
              updatedTripRequestObj
            );
            SendNotification(
              updatedTripRequestObj.riderId,
              updatedTripRequestObj.tripRequestStatus
            );
            SendNotification(
              updatedTripRequestObj.driver,
              updatedTripRequestObj.tripRequestStatus
            );
          }
        });
      })
      .error(e => {
        // error occured while updating tripRequestObj
        SocketStore.emitByUserId(payload.riderId, "socketError", e);
        SocketStore.emitByUserId(payload.driverId, "socketError", e);
      });
  });
  // Round robin algorithm for driver dispatch:
  function roundRobinAsync(nearByDriversDoc, quantum, rider) {
    console.log(nearByDriversDoc);
    // returns promise which resolves in success and faliure boolean values
    // suppose 5 drivers
    // each driver will be sent request.
    // expect a response in quantum time.
    // if response is accept - assign that driver. break process and return
    // if response is reject - remove driver from the list and select next driver to request from queue
    // if no response - next driver please.
    // - no arrival time burst time concept.
    // - queue structure will be based on database query fetch.
    return new Promise((resolve, reject) => {
      const count = 0;
      const remain = nearByDriversDoc.length;
      const prom = deferred();
      dispatchHandlerAsync(
        nearByDriversDoc,
        quantum,
        remain,
        count,
        rider,
        prom
      )
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  function dispatchHandlerAsync(
    nearByDrivers,
    quantum,
    remain,
    count,
    rider,
    prom
  ) {
    console.log("here in dispatchHandlerAsync");
    if (remain <= 0) {
      prom.resolve(false);
      return prom.promise;
    }
    promObj[nearByDrivers[count]._id] = deferred();
    sendRequestAsync(
      nearByDrivers[count],
      quantum,
      rider,
      promObj[nearByDrivers[count]._id]
    ).then(
      tripRequest => {
        const response = tripRequest.tripRequestStatus;
        if (response === "enRoute") {
          dispatchDriverAsync(tripRequest)
            .then(() => prom.resolve(true))
            .catch(error => prom.reject(error));
          getConfig().then(data => {
            if (data.email.rideAcceptRider) {
              // sendEmail(tripRequest.riderId, tripRequest, "rideAccept");
            }
            if (data.sms.rideAcceptRider) {
              // sendSms(tripRequest.riderId, "Your ride request is accepted .");
            }
          });
        } else if (response === "rejected") {
          resetTripRequestAsync(nearByDrivers[count]) // driver rejected so update the database to clear tripRequest made
            .then(() => {
              nearByDrivers = removeDriverFromList(nearByDrivers, count);
              // nearByDrivers.forEach((driver) => console.log(driver.Client connected to socket));
              count = 0;
              remain--;
              setTimeout(() => {
                dispatchHandlerAsync(
                  nearByDrivers,
                  quantum,
                  remain,
                  count,
                  rider,
                  prom
                );
              }, 1000);
            });
        }
      },
      () => {
        console.log("noResponseFromDriver");
        nearByDrivers = removeDriverFromList(nearByDrivers, count);
        count = 0;
        remain--;
        setTimeout(() => {
          dispatchHandlerAsync(
            nearByDrivers,
            quantum,
            remain,
            count,
            rider,
            prom
          );
        }, 1000);
      }
    );
    return prom.promise;
  }
  function sendRequestAsync(driver, timeout, rider, def) {
    // return tripRequest object which contain response
    console.log("inside sendRequestAsync", driver.fname);
    createTripRequestObjAsync(rider, driver)
      .then(tripRequestObj => {
        // here for notificatioon to add final
        SendNotification(driver._id, "New Ride Request");
        SocketStore.emitByUserId(driver._id, "requestDriver", tripRequestObj);
        watchIdObj[tripRequestObj._id] = setInterval(() => {
          timeout--;
          if (timeout <= 0) {
            clearInterval(watchIdObj[tripRequestObj._id]);
            resetTripRequestAsync(driver) // driver did not respond so update the database to clear tripRequest made.
              .then(() => {
                SocketStore.emitByUserId(driver._id, "responseTimedOut"); // clear tripRequest object on driver side
                // flag = true;
                def.reject("noResponseFromDriver");
              });
          }
        }, 1000);
      })
      .catch(err => console.log("error", err));
    return def.promise;
  }
  function dispatchDriverAsync(tripRequestObj) {
    return new Promise(resolve => {
      TripRequest.findOneAndUpdateAsync(
        { _id: tripRequestObj._id },
        { $set: tripRequestObj },
        { new: true }
      )
        .then(updatedTripRequestObject =>
          resolve(
            fetchReturnObj(updatedTripRequestObject).then(
              updatedTripRequestObj => {
                if (
                  updatedTripRequestObj.tripRequestStatus === "noNearByDriver"
                ) {
                  updatedTripRequestObj.rider = null;
                  updatedTripRequestObj.driver = null;
                  updatedTripRequestObj.driverId = null;
                }
                SocketStore.emitByUserId(
                  tripRequestObj.riderId,
                  "tripRequestUpdated",
                  updatedTripRequestObj
                );
              }
            )
          )
        )
        .error(e => {
          SocketStore.emitByUserId(tripRequestObj.driverId, "socketError", e);
        });
    });
  }
  function removeDriverFromList(drivers, index) {
    // test passed
    return drivers.slice(0, index).concat(drivers.slice(index + 1));
  }
  function createTripRequestObjAsync(payload, driver) {
    return new Promise(resolve => {
      const riderID = payload.rider._id;
      const srcLocation = payload.tripRequest.srcLoc;
      const destLocation = payload.tripRequest.destLoc;
      const pickUpAdrs = payload.tripRequest.pickUpAddress;
      const destAdrs = payload.tripRequest.destAddress;
      const latDelta = payload.tripRequest.latitudeDelta;
      const lonDelta = payload.tripRequest.longitudeDelta;
      const paymentMode = payload.tripRequest.paymentMode;
      const driverID = driver._id;
      const tripRequestObj = new TripRequest({
        riderId: riderID,
        driverId: driverID,
        tripId: null,
        srcLoc: srcLocation,
        destLoc: destLocation,
        pickUpAddress: pickUpAdrs,
        destAddress: destAdrs,
        latitudeDelta: latDelta,
        longitudeDelta: lonDelta,
        paymentMode
      });
      tripRequestObj
        .saveAsync()
        .then(savedTripRequest => {
          savedTripRequest.rider = null;
          savedTripRequest.driver = null;
          UserSchema.updateAsync(
            {
              $or: [
                { _id: savedTripRequest.riderId },
                { _id: savedTripRequest.driverId }
              ]
            },
            {
              $set: {
                currTripId: savedTripRequest._id,
                currTripState: "tripRequest"
              }
            },
            { new: true, multi: true }
          )
            .then(() => {
              fetchReturnObj(savedTripRequest).then(returnObj =>
                resolve(returnObj)
              );
            })
            .error(e => {
              SocketStore.emitByUserId(riderID, "socketError", {
                message: "error while updating curTripId in requestTrip",
                data: e
              });
              SocketStore.emitByUserId(driverID, "socketError", {
                message: "error while updating curTripId in requestTrip",
                data: e
              });
            });
        })
        .error(e => {
          SocketStore.emitByUserId(riderID, "socketError", e);
        });
    });
  }
  function resetTripRequestAsync(driverObj) {
    // query to reset tripRequest object for a particular driver in database.
    return new Promise(resolve => {
      UserSchema.updateAsync(
        { $or: [{ _id: driverObj._id }] },
        { $set: { currTripId: null, currTripState: null } },
        { new: true, multi: true }
      )
        .then(() => resolve())
        .error(e => {
          SocketStore.emitByUserId(driverObj.riderId, "socketError", {
            message:
              "error while updating curTripId  to null in requestDriverResponse",
            data: e
          });
          SocketStore.emitByUserId(driverObj.driverId, "socketError", {
            message:
              "error while updating curTripId to null in requestDriverResponse",
            data: e
          });
        });
    });
  }
  function checkSocketConnection(id) {
    const res = SocketStore.getByUserId(id);
    if (res.success && res.data.length) {
      return true;
    } else {
      return false;
    }
  }
  function nearByDriver(riderId) {
    return new Promise((resolve, reject) =>
      UserSchema.findOneAsync({ _id: riderId, userType: "rider" })
        .then(userDoc => {
          if (userDoc) {
            // debug hereeeeee
            return UserSchema.findAsync({
              $and: [
                {
                  gpsLoc: {
                    $geoWithin: {
                      $centerSphere: [userDoc.mapCoordinates, config.radius]
                    }
                  }
                },
                // { gpsLoc: { $geoWithin: { $center: [userDoc.gpsLoc, config.radius] } } },
                { currTripId: null, currTripState: null },
                { loginStatus: true },
                { userType: "driver" },
                { isAvailable: true }
              ]
            })
              .then(driverDoc => {
                if (driverDoc) {
                  // console.log('hree list', driverDoc);
                  return resolve(driverDoc);
                } else {
                  // console.log('no nearByDriver driver found');
                  const err = new APIError(
                    "no nearByDriver found",
                    httpStatus.INTERNAL_SERVER_ERROR
                  );
                  return reject(err);
                }
              })
              .error(driverErr => {
                // console.log('error while searching near by driver ');
                reject(driverErr);
              });
          } else {
            // console.log('no rider found with the given rider id');
            const err = new APIError(
              "no rider found with the given id",
              httpStatus.INTERNAL_SERVER_ERROR
            );
            return reject(err);
          }
        })
        .error(e => {
          // console.log('error while searching rider ');
          const err = new APIError(
            `error while searching user ${e}`,
            httpStatus.INTERNAL_SERVER_ERROR
          );
          reject(err);
        })
    );
  }
}

export default requestTripHandler;
