import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const TripRequestSchema = new Schema({
  riderId: { type: Schema.Types.ObjectId, ref: 'User' },
  driverId: { type: Schema.Types.ObjectId, ref: 'User' },
  tripId: { type: Schema.Types.ObjectId, ref: 'trip' },
  srcLoc: {
    type: [Number],
    index: '2d'
  },
  destLoc: {
    type: [Number],
    index: '2d'
  },
  paymentMode: { type: String, default: 'CASH' },
  tripRequestStatus: { type: String, default: 'request' },
  tripRequestIssue: { type: String, default: 'busy' },
  pickUpAddress: { type: String, default: null },
  destAddress: { type: String, default: null },
  latitudeDelta: { type: Number, default: 0.012 },
  longitudeDelta: { type: Number, default: 0.012 },
  requestTime: { type: Date, default: Date.now }
});


TripRequestSchema.statics = {
  userList({
    skip = 0, limit = 10, userId = null, userType = null
  } = {}) {
    let searchObj = {};
    if (userType === 'rider') {
      searchObj = {};
      searchObj.riderId = userId;
    }
    if (userType === 'driver') {
      searchObj = {};
      searchObj.driverId = userId;
    }
    return this.find(searchObj)
      .skip(skip)
      .limit(limit)
      .populate('riderId driverId tripId')
      .execAsync();
  },


  getUserCount(userType, userId) {
    let searchObj = {};
    if (userType === 'rider') {
      searchObj = {};
      searchObj.riderId = userId;
    }
    if (userType === 'driver') {
      searchObj = {};
      searchObj.driverId = userId;
    }

    return this.countAsync(searchObj);
  }
};

export default mongoose.model('tripRequest', TripRequestSchema);
