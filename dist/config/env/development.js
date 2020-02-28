"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = {
  env: "development",
  jwtSecret: "0a6b944d-d2fb-46fc-a85e-0295c986cd9f",
  //db: 'mongodb://localhost/taxiApp-development',
  //db: "mongodb://root:Password!2@ds341557.mlab.com:41557/nitprise-development",
  db: "mongodb+srv://nitprise:Rishabh2019@cluster0-sclfx.mongodb.net/klixx?retryWrites=true&w=majority",
  port: 3010,
  passportOptions: {
    session: false
  },
  radius: 50 / 6378,
  // where 20 Kms is used as radius to find nearby driver
  arrivedDistance: 200,
  arrivingDistance: 1000,
  limit: 10,
  skip: 0,
  tripFilter: "All"
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=development.js.map
