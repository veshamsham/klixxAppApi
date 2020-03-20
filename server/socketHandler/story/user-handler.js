import SocketStore from '../../service/socket-store.js'; //eslint-disable-line
import UserSchema from '../../models/user';

/**
 * user handler, handle update of the driver availability and send to riders
 * * @param socket object
 * @returns {*}
 */
/* eslint-disable */

function userHandler(socket) {
  socket.on('updateAvailable', userObj => {
    const userType = userObj.userType;
    let searchObj = {};
    if (userType === '2') {
      searchObj = {
        driverId: userObj._id,
      };
    }
    const userID = userObj._id;
    console.log(userID+"user id");
    UserSchema.findOneAndUpdateAsync({ _id: userID }, { $set: { isAvailable: userObj.isAvailable } }, { new: true })
      .then(updatedUser => {
        console.log(updatedUser+"updated user")
        // socket.emit("updateAvailable",{"updateAvailable":updatedUser})

        SocketStore.emitByUserId(userID, 'updateAvailable', updatedUser);

        SocketStore.emitToAll('updateAvailable', updatedUser);
      })
      .error(e => {
        SocketStore.emitByUserId(userID, 'socketError', e);
      });
  });
}

export default userHandler;
