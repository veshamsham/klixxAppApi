import bcrypt from "bcrypt";
import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";

/**
 * User Schema
 */
const UserSchema = new mongoose.Schema({
  fname: { type: String, default: null },
  lname: { type: String, default: null },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  userName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },
  phoneNo: { type: String, unique: true },
  password: { type: String, required: true, select: false },
  dob: { type: Date, default: "12/8/1993" },
  bloodGroup: { type: String, default: "B+" },
  address: { type: String, default: null },
  city: { type: String, default: "Bangalore" },
  state: { type: String, default: "Karnataka" },
  country: { type: String, default: "India" },
  emergencyDetails: {
    phone: { type: String, default: "" },
    name: { type: String, default: null }
  },
  gpsLoc: {
    type: [Number],
    index: "2d"
  },
  latitudeDelta: { type: Number, default: 0.013 },
  longitudeDelta: { type: Number, default: 0.022 },
  userRating: { type: Number, default: 0 },
  profileUrl: {
    type: String,
    default:
      "http://res.cloudinary.com/taxiapp/image/upload/v1505805106/noun_17237_agwqgt.png"
  },
  currTripId: { type: String, default: null },
  currTripState: { type: String, default: null },
  userType: { type: String, default: "customer" },
  loginStatus: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  otp: { type: Number, default: null },
  isApproved: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  homeAddress: { type: String, default: null },
  workAddress: { type: String, default: null },
  verified: { type: Boolean, default: true },
  jwtAccessToken: { type: String, default: null },
  userCardId: { type: String, default: null },
  carDetails: {
    type: { type: String, default: "GO" },
    company: { type: String, default: "Maruti Suzuki" },
    regNo: { type: String, default: "NYC 123" },
    RC_ownerName: { type: String, default: null },
    vehicleNo: { type: String, default: null },
    carModel: { type: String, default: "Swift Dzire" },
    regDate: { type: Date, default: "1/1/2017" }
  },
  insuranceUrl: { type: String, default: null },
  vechilePaperUrl: { type: String, default: null },
  rcBookUrl: { type: String, default: null },
  licenceUrl: { type: String, default: null },
  licenceDetails: {
    licenceNo: { type: String, default: null },
    issueDate: { type: Date, default: null },
    expDate: { type: Date, default: null }
  },
  bankDetails: {
    accountNo: { type: String, default: null },
    holderName: { type: String, default: null },
    IFSC: { type: String, default: null }
  },
  cardDetails: [{}],
  mapCoordinates: {
    type: [Number],
    index: "2d"
  },
  deviceId: { type: String, default: null },
  pushToken: { type: String, default: null },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
UserSchema.index({ fname: 'text', lname: 'text', userName: 'text' });

/**
 * converts the string value of the password to some hashed value
 * - pre-save hooks
 * - validations
 * - virtuals
 */
// eslint-disable-next-line
UserSchema.pre("save", function userSchemaPre(next) {
  const user = this;
  if (this.isModified("password") || this.isNew) {
    // eslint-disable-next-line
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
      } // eslint-disable-next-line
      bcrypt.hash(user.password, salt, (hashErr, hash) => {
        //eslint-disable-line
        if (hashErr) {
          return next(hashErr);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

/**
 * comapare the stored hashed value of the password with the given value of the password
 * @param pw - password whose value has to be compare
 * @param cb - callback function
 */
UserSchema.methods.comparePassword = function comparePassword(pw, cb) {
  const that = this;
  // eslint-disable-next-line
  bcrypt.compare(pw, that.password, (err, isMatch) => {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};
/**
 * Statics
 */
UserSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
      .execAsync()
      .then(user => {
        if (user) {
          return user;
        }
        const err = new APIError("No such user exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ skip = 0, limit = 20 } = {}) {
    return this.find({ $or: [{ userType: "customer" }, { userType: "photographer" }] })
      .sort({ _id: -1 })
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .execAsync();
  }
};
/**
 * @typedef User
 */
export default mongoose.model("User", UserSchema);
