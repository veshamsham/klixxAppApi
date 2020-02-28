"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _compression = _interopRequireDefault(require("compression"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _cors = _interopRequireDefault(require("cors"));

var _express = _interopRequireDefault(require("express"));

var _expressValidation = _interopRequireDefault(require("express-validation"));

var _expressWinston = _interopRequireDefault(require("express-winston"));

var _helmet = _interopRequireDefault(require("helmet"));

var _httpStatus = _interopRequireDefault(require("http-status"));

var _methodOverride = _interopRequireDefault(require("method-override"));

var _passport = _interopRequireDefault(require("passport"));

var _path = _interopRequireDefault(require("path"));

var _APIError = _interopRequireDefault(require("../server/helpers/APIError"));

var _env = _interopRequireDefault(require("./env"));

var _routes = _interopRequireDefault(require("../server/routes"));

var _winston = _interopRequireDefault(require("./winston"));

var _passportConfig = _interopRequireDefault(require("./passport-config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var app = (0, _express["default"])();

var server = require('http').createServer(app);

if (_env["default"].env === 'development') {} // app.use(logger('dev'));
// parse body params and attache them to req.body


app.use(_bodyParser["default"].json());
app.use(_bodyParser["default"].urlencoded({
  extended: true
}));
app.use((0, _cookieParser["default"])());
app.use((0, _compression["default"])());
app.use((0, _methodOverride["default"])()); // configure passport for authentication

(0, _passportConfig["default"])(_passport["default"]);
app.use(_passport["default"].initialize()); // secure apps by setting various HTTP headers

app.use((0, _helmet["default"])()); // enable CORS - Cross Origin Resource Sharing

app.use((0, _cors["default"])()); // enable detailed API logging in dev env

if (_env["default"].env === 'development') {
  _expressWinston["default"].requestWhitelist.push('body');

  _expressWinston["default"].responseWhitelist.push('body');
} // mount public folder on / path


app.get('', function (req, res) {
  res.sendFile(_path["default"].resolve(__dirname, '../../public/index.html'));
}); // mount all routes on /api path

app.use('/api', _routes["default"]); // if error is not an instanceOf APIError, convert it.

app.use(function (err, req, res, next) {
  // console.log('===============================================');
  if (err instanceof _expressValidation["default"].ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    var unifiedErrorMessage = err.errors.map(function (error) {
      return error.messages.join('. ');
    }).join(' and ');
    var error = new _APIError["default"](unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof _APIError["default"])) {
    var apiError = new _APIError["default"](err.message, err.status, err.isPublic);
    return next(apiError);
  }

  return next(err);
}); // catch 404 and forward to error handler

app.use(function (req, res, next) {
  var err = new _APIError["default"]('API not found', _httpStatus["default"].NOT_FOUND);
  return next(err);
}); // log error in winston transports except when executing test suite

if (_env["default"].env !== 'test') {
  app.use(_expressWinston["default"].errorLogger({
    winstonInstance: _winston["default"]
  }));
} // error handler, send stacktrace only during development


app.use(function (err, req, res, next) {
  return (//eslint-disable-line
    res.status(err.status).json({
      success: false,
      message: err.isPublic ? err.message : _httpStatus["default"][err.status],
      stack: _env["default"].env === 'development' ? err.stack : {}
    })
  );
});
var _default = server;
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=express.js.map
