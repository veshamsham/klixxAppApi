import jwt from "jsonwebtoken";
import config from "./env";
import sockeHandler from "../server/socketHandler";
import SocketStore from "../server/service/socket-store";

function startSocketServer(server) {
  const io = require("socket.io").listen(server); //eslint-disable-line
  console.log(server)
  console.log("SocketServer started11"); //eslint-disable-line
  io.on("connection", socket => {
    console.log("hi1")
    // console.log('Client connected to socket', socket.id, '@@', socket.handshake.query.token); //eslint-disable-line
    let authToken = "";
    // check for authentication of the socket
    if (socket.handshake.query && socket.handshake.query.token) {
      authToken = socket.handshake.query.token.replace("JWT ", "");
    }
    console.log(authToken)
    jwt.verify(authToken, config.jwtSecret, (err, userDtls) => {
      // console.log(authToken, '--------');
      if (err) {
        console.log("error connection to socket=====");
        socket.disconnect();
      } else if (userDtls) {
        console.log(userDtls, "check user inside socket_server");
        socket.userId = userDtls._id; //eslint-disable-line
        console.log(
          `inside socket server \n\n ${userDtls._id} ${userDtls.email} ${userDtls.fname}`
        ); //eslint-disable-line
        SocketStore.addByUserId(socket.userId, socket);
        sockeHandler(socket); // call socketHandler to handle different socket scenario
      }
    });
  });


  
}

export default { startSocketServer };
