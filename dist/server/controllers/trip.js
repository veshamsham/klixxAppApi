"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpStatus = _interopRequireDefault(require("http-status"));

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _cloudinary = _interopRequireDefault(require("cloudinary"));

var _lodash = require("lodash");

var _formidable = _interopRequireDefault(require("formidable"));

var _APIError = _interopRequireDefault(require("../helpers/APIError"));

var _transformResponse = require("../service/transform-response");

var _trip = _interopRequireDefault(require("../models/trip"));

var _env = _interopRequireDefault(require("../../config/env"));

var _serverConfig = _interopRequireDefault(require("../models/serverConfig"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { trip: historyObjArray[{ tripObj }]  }
 */
function getHistory(req, res, next) {
  var historyObjArray = [];
  var userID = req.user._id; //eslint-disable-line

  var userType = req.user.userType;
  var searchObj = {};

  if (userType === "rider") {
    searchObj.riderId = userID;
  } else if (userType === "driver") {
    searchObj.driverId = userID;
  }

  _trip["default"].find({
    $and: [searchObj, {
      tripStatus: "endTrip"
    }]
  }, null, {
    sort: {
      bookingTime: -1
    }
  }, function (tripErr, tripObj) {
    //eslint-disable-line
    if (tripErr) {
      var err = new _APIError["default"]("error while finding trip history for the user  ".concat(tripErr), _httpStatus["default"].INTERNAL_SERVER_ERROR);
      return next(err);
    }

    if (tripObj.length !== 0) {
      tripObj.forEach(function (obj, index) {
        (0, _transformResponse.fetchReturnObj)(obj).then(function (transformedReturnObj) {
          historyObjArray.push(transformedReturnObj);

          if (index === tripObj.length - 1) {
            var returnObj = {
              success: true,
              message: "user trip history",
              data: historyObjArray
            };
            res.send(returnObj);
          }
        });
      });
    } else {
      var returnObj = {
        success: true,
        message: "no history available",
        data: []
      };
      res.send(returnObj);
    }
  });
}
/**
 * Get getCloudinaryDetails
 * @returns {Cloudinary Details}

 */


function getCloudinaryDetails() {
  return new Promise(function (resolve, reject) {
    _serverConfig["default"].findOneAsync({
      key: "cloudinaryConfig"
    }).then(function (foundDetails) {
      resolve(foundDetails.value);
    })["catch"](function (err) {
      reject(err);
    });
  });
}
/**
 * Return the trip details of the user.
 * @param req
 * @param res
 * @param next
 * @returns { tripObj }
 */


function updateTrip(req, res, next) {
  console.log(req, "reqreqreqreq"); //eslint-disable-line

  var userType = req.user.userType;
  getCloudinaryDetails().then(function (value) {
    if (value) {
      _cloudinary["default"].config({
        cloud_name: value.cloud_name,
        api_key: value.api_key,
        api_secret: value.api_secret
      });

      var form = new _formidable["default"].IncomingForm();
      form.on("error", function (err) {
        console.error(err, "error heree"); //eslint-disable-line
      });
      form.parse(req, function (err, fields, files) {
        var img = (0, _lodash.get)(files, "image.path", "");
        var tripID = fields.tripId;

        _cloudinary["default"].v2.uploader.upload(img, // {
        //   transformation: [
        //     {
        //       effect: 'improve',
        //       gravity: 'face',
        //       height: 100,
        //       width: 100,
        //       crop: 'fill',
        //     },
        //     { quality: 'auto' },
        //   ],
        // },
        function (error, results) {
          if (results) {
            _trip["default"].findOneAndUpdateAsync({
              _id: fields.tripId
            }, {
              $set: {
                receiptUrl: results.url
              }
            }, {
              "new": 1,
              runValidators: true
            }).then(function (updatedTripObj) {
              //eslint-disable-line
              var returnObj = {
                success: false,
                message: "unable to update trip object as trip id provided didnt match",
                data: null,
                meta: null
              };

              if (updatedTripObj) {
                returnObj.success = true;
                returnObj.message = "trip object updated";
                returnObj.data = updatedTripObj;
                res.send(returnObj);
              } else {
                var _err = new _APIError["default"]("Trip Id did not matched", _httpStatus["default"].BAD_REQUEST);

                return next(_err);
              }
            }).error(function (e) {
              var err = new _APIError["default"]("Error occured while updatating trip object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
              next(err);
            });
          }
        });
      });
    }
  })["catch"](function (e) {
    var err = new _APIError["default"]("Error occured while updatating trip object ".concat(e), _httpStatus["default"].INTERNAL_SERVER_ERROR);
    next(err);
  });
}

var _default = {
  getHistory: getHistory,
  updateTrip: updateTrip
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=trip.js.map
