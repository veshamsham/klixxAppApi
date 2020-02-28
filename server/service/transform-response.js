import Promise from 'bluebird';
import UserSchema from '../models/user';

export function fetchReturnObj(obj) {
  let returnObj = {};
  returnObj = obj.toObject();
  return new Promise((resolve, reject) => {
    getRiderObj(returnObj.riderId).then((riderObj) => {
      if (riderObj) {
        returnObj.rider = riderObj;
      }
    }).then(() =>
      getDriverDtls(returnObj.driverId, reject).then((driverObj) => {
        returnObj.driver = driverObj;
      })).then(() => {
      resolve(returnObj);
      return returnObj;
    });
  });
}

export function getRiderObj(riderId) {
  return UserSchema.findOneAsync({ _id: riderId, userType: 'rider' });
}

export function getDriverDtls(driverId, reject) {
  return UserSchema.findOneAsync({ _id: driverId, userType: 'driver' })
  // .then((userDtls) => {
  //   if (userDtls) {
  //     return DriverSchema.findOneAsync({ driverId: userDtls._id }). then((driverExtraDetails) => {
  //       if (driverExtraDetails) {
  //         const userObject = userDtls.toObject();
  //         userObject.carDetails = driverExtraDetails.carDetails;
  //         return userObject;
  //       }
  //     })
  //     .error((e) => reject(e));
  //   }
  // })
    .error(errDriverDtls => reject(errDriverDtls));
}
