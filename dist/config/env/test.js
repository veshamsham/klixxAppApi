"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = {
  env: 'test',
  jwtSecret: '0a6b944d-d2fb-46fc-a85e-0295c986cd9f',
  //db: 'mongodb://localhost/taxiApp-api-test',
  // db: 'mongodb+srv://nitprise:Rishabh2019@cluster0-sclfx.mongodb.net/klixx?retryWrites=true&w=majority',
  db:"mongodb+srv://rajeev:SzjcRGwIFfdR8uGJ@cluster0-sclfx.mongodb.net/test?retryWrites=true&w=majority",
  port: 4123,
  passportOptions: {
    session: false
  },
  radius: 320000000000 / 6371,
  arrivedDistance: 200,
  arrivingDistance: 1000,
  limit: 10,
  skip: 0,
  tripFilter: 'All'
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=test.js.map
