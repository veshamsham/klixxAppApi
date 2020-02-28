/* eslint-disable */
function transformReturnObj(Data) {
  if (Data instanceof Object) {
    Data = Data.toObject();
    if (Data.riderId) {
      Data.rider = Data.riderId;
      Data.riderId = Data.rider._id ? Data.rider._id : null;
    }
    if (Data.driverId) {
      Data.driver = Data.driverId;
      Data.driverId = Data.driver._id ? Data.driver._id : null;
    }
  }
  return Data;
}


export default { transformReturnObj };
