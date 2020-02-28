"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _passportJwt = _interopRequireDefault(require("passport-jwt"));

var _env = _interopRequireDefault(require("./env"));

var _user = _interopRequireDefault(require("../server/models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var ExtractJwt = _passportJwt["default"].ExtractJwt;
var jwtStrategy = _passportJwt["default"].Strategy;

function passportConfiguration(passport) {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt'); // opts.tokenQueryParameterName = ExtractJwt.fromUrlQueryParameter(auth_token);

  opts.secretOrKey = _env["default"].jwtSecret;
  passport.use(new jwtStrategy(opts, function (jwtPayload, cb) {
    _user["default"].findOneAsync({
      _id: jwtPayload._id
    }) //eslint-disable-line
    .then(function (user) {
      return cb(null, user);
    }).error(function (err) {
      return cb(err, false);
    });
  }));
}

var _default = passportConfiguration;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=passport-config.js.map
