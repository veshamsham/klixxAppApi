"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _serverConfig = _interopRequireDefault(require("../models/serverConfig"));

var _user = _interopRequireDefault(require("../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/* eslint-disable */
//eslint-disable-line
function mobileVerify(req, res, next) {}

function emailVerify(req, res, next) {
  _user["default"].findOneAsync({
    email: req.query.email
  }) //eslint-disable-next-line
  .then(function (foundUser) {
    if (foundUser) {
      var host = req.get('host');
      console.log(req.protocol + ":/" + req.get('host'));

      if (req.protocol + "://" + req.get('host') == "http://" + host) {
        console.log("Domain is matched. Information is from Authentic email");

        if (req.query.check === foundUser.otp) {
          _user["default"].findOneAndUpdateAsync({
            email: req.query.email
          }, {
            $set: {
              emailVerified: true
            }
          }, {
            "new": true
          }) //eslint-disable-line
          .then(function (updateUserObj) {
            //eslint-disable-line
            if (updateUserObj) {
              var returnObj = {
                success: true,
                message: 'Email verified',
                data: {}
              }; // returnObj.data.user = updateUserObj;

              returnObj.success = true;
              return res.send(returnObj);
            }
          }).error(function (e) {
            var err = new APIError("error in updating user details while login ".concat(e), httpStatus.INTERNAL_SERVER_ERROR);
            next(err);
          });

          console.log("Email is verified");
          res.end("<h1>Email is been Successfully verified</h1>");
        } else {
          console.log("Email is not verified");
          res.end("<h1>Bad Request</h1>");
        }
      }
    }
  });
}

var _default = {
  mobileVerify: mobileVerify,
  emailVerify: emailVerify
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=verify.js.map
