import httpStatus from "http-status";
import mongoose from "mongoose";
import APIError from "../helpers/APIError";
import UserSchema from "./user";

const debug = require("debug")("Taxi-app-backend-web-dashboard: trip model");

const Schema = mongoose.Schema;
const TripSchema = new Schema({
  riderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  driverId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  srcLoc: {
    type: [Number],
    index: "2d"
  },
  destLoc: {
    type: [Number],
    index: "2d"
  },
  pickUpAddress: { type: String, default: null },
  destAddress: { type: String, default: null },
  latitudeDelta: { type: Number, default: 0.0123 },
  longitudeDelta: { type: Number, default: 0.0123 },
  paymentMode: { type: String, default: "CASH" },
  paymentStatus: { type: String, default: null },
  receiptUrl: { type: String, default: null },
  tripAmt: { type: Number, default: 0 },
  tripDist: { type: Number, default: 0 },
  bookingTime: { type: Date, default: Date.now },
  tripEndTime: { type: Date, default: null },
  travelTime: { type: Number, default: 0 },
  taxiType: { type: String, default: "TaxiGo" },
  riderRatingByDriver: { type: Number, default: 0 },
  driverRatingByRider: { type: Number, default: 0 },
  riderReviewByDriver: { type: String, default: null },
  driverReviewByRider: { type: String, default: null },
  seatBooked: { type: Number, default: 0 },
  tripStatus: { type: String, default: "onTrip" },
  tripIssue: { type: String, default: "noIssue" },
  roadMapUrl: { type: String, default: null }
});

// TripSchema.path("riderId").validate((riderId, respond) => {
//   debug(`inside validator with riderId value ->${riderId}`);
//   return UserSchema.findByIdAsync(riderId).then(riderData => {
//     if (riderData) {
//       return respond(true);
//     } else {
//       debug(`rider validation failed ${riderData}`);
//       return respond(false);
//     }
//   });
// }, "Invalid Rider Id");

// TripSchema.path("driverId").validate((driverId, respond) => {
//   debug(`inside validator with driverId value ->${driverId}`);
//   return UserSchema.findByIdAsync(driverId).then(driverData => {
//     if (driverData) {
//       return respond(true);
//     } else {
//       debug(`driver validation failed ${driverData}`);
//       return respond(false);
//     }
//   });
// }, "Invalid DriverId");

TripSchema.statics = {
  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ skip, limit, filter } = {}) {
    let searchObj = {};
    switch (filter) {
      case "Ongoing":
        searchObj = {};
        searchObj.tripStatus = "onTrip";
        break;
      case "Completed":
        searchObj = {};
        searchObj.tripStatus = "endTrip";
        break;
      default:
        searchObj = {};
    }
    return this.find(searchObj)
      .sort({ _id: -1 })
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .populate("riderId driverId")
      .execAsync();
  },

  get(tripId) {
    return this.findById(tripId)
      .populate("riderId driverId")
      .execAsync()
      .then(tripObj => {
        if (tripObj) {
          return tripObj;
        }
        const err = new APIError("No such trip exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  getCount(filter) {
    let searchObj = {};
    switch (filter) {
      case "Ongoing":
        searchObj = {};
        searchObj.tripStatus = "onTrip";
        break;
      case "Completed":
        searchObj = {};
        searchObj.tripStatus = "endTrip";
        break;
      default:
        searchObj = {};
    }
    return this.count(searchObj).execAsync();
  }
};

export default mongoose.model("trip", TripSchema);
