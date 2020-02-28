import Promise from "bluebird";
import mongoose from "mongoose";
import config from "./config/env";
import app from "./config/express";
import socketServer from "./config/socket-server";

// promisify mongoose

Promise.promisifyAll(mongoose);

// connect to mongo db
mongoose.connect(
  config.db,
  {
    bufferMaxEntries: 0,
    socketTimeoutMS: 0,
    keepAlive: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false
  },
  () => {
    if (config.env === "test") {
      mongoose.connection.db.dropDatabase();
    }
  }
);
mongoose.connection.on("error", () => {
  throw new Error(`unable to connect to database: ${config.db}`);s
});

const debug = require("debug")("Taxi-app-backend-web-dashboard:index");
// starting socket server
socketServer.startSocketServer(app);

// listen on port config.port
app.listen(process.env.PORT || config.port, () => {
  console.log(
    `server started on Port: ${config.port} Environment:${config.env}`
  );
});

export default app;
