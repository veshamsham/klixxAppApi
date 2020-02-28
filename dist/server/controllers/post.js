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

var _post = _interopRequireDefault(require("../models/post"));

var _user = _interopRequireDefault(require("../models/user"));

var _env = _interopRequireDefault(require("../../config/env"));

var _serverConfig = _interopRequireDefault(require("../models/serverConfig"));

var _notification = _interopRequireDefault(require("./notification"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Return the post details of the user.
 * @param req
 * @param res
 * @param next
 * @returns
 */
function decode(token) {
  return _jsonwebtoken["default"].decode(token, _env["default"].jwtSecret);
}

function tokenFromHeaders(req) {
  if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "JWT") {
    return req.headers.authorization.split(" ")[1];
  }

  return "";
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

function getByUserId(req, res, next) {
  var userId = (0, _lodash.get)(req.query, "userId");

  if (!userId) {
    userId = (0, _lodash.get)(req.user, "_id");
  }

  var pageNo = parseInt((0, _lodash.get)(req.query, "pageNo", 1));
  var limit = parseInt((0, _lodash.get)(req.query, "limit", 20));
  var skip = (pageNo - 1) * limit;
  var pages;
  var totalCount;

  _post["default"].find({
    userId: userId
  }).then(function (result) {
    pages = result.length < limit ? 1 : Math.ceil(result.length / limit);
    totalCount = result.length;

    _post["default"].find({
      userId: userId
    }, null, {
      sort: {
        postedAt: -1
      },
      limit: limit,
      skip: skip
    }).populate("userId", "fname lname userName profileUrl").then(function (posts) {
      return res.send({
        success: true,
        data: {
          posts: posts,
          pages: pages,
          totalCount: totalCount
        },
        message: "Fetched all post by user"
      });
    });
  })["catch"](function (e) {
    return res.send({
      success: false,
      data: e,
      message: "failed to fetch all post by user"
    });
  });
}

function getById(req, res, next) {
  var id = req.params.id;

  _post["default"].findOne({
    _id: id
  }).populate("userId", "fname lname userName profileUrl").then(function (result) {
    if (result) {
      return res.send({
        success: true,
        data: result,
        message: "fetched post by ID"
      });
    }

    return res.send({
      success: false,
      data: null,
      message: "falied to fetch post by ID"
    });
  })["catch"](function (e) {
    return res.send({
      success: false,
      data: e,
      message: "falied to fetch post by ID"
    });
  });
}

function updatePost(req, res, next) {
  res.send({
    hello: "asdsa"
  });
}

function deletePost(req, res, next) {
  var id = req.params.id;

  _post["default"].remove({
    _id: id
  }).then(function (result) {
    if (result) {
      return res.send({
        success: true,
        data: result,
        message: "Deleted post by ID"
      });
    }

    return res.send({
      success: false,
      data: null,
      message: "Falied to delete post by ID"
    });
  })["catch"](function (e) {
    return res.send({
      success: false,
      data: e,
      message: "Falied to delete post by ID"
    });
  });
}

function createPost(req, res, next) {
  var token = tokenFromHeaders(req);
  var userData = decode(token);
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

        _cloudinary["default"].v2.uploader.upload(img, function (error, results) {
          if (error) {
            return res.send({
              success: false,
              message: "Image Not Found"
            });
          }

          if (results) {
            _post["default"].create({
              imageUrl: results.url,
              userId: (0, _lodash.get)(userData, "_id", ""),
              caption: fields.caption,
              longAddress: fields.longAddress,
              shortAddress: fields.shortAddress,
              loc: !fields.loc ? undefined : JSON.parse(fields.loc),
              postedAt: Date.now()
            }).then(function (data) {
              var notificationData = {
                userId: req.user._id,
                postId: data._id
              };

              _notification["default"].createNotification("post", notificationData);

              res.send({
                success: true,
                message: "image uplaoded"
              });
            })["catch"](function (e) {
              res.send({
                success: false,
                message: "failed to upload"
              });
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

function fetchFollowingsPosts(req, res, next) {
  var followings = (0, _lodash.get)(req.user, "followings", []);
  var pageNo = parseInt((0, _lodash.get)(req.query, "pageNo", 1));
  var limit = parseInt((0, _lodash.get)(req.query, "limit", 10));
  var skip = (pageNo - 1) * limit;
  var pages;
  var totalCount;

  _post["default"].find({
    userId: followings
  }).then(function (result) {
    pages = result.length < limit ? 1 : Math.ceil(result.length / limit);
    totalCount = result.length;

    _post["default"].find({
      userId: followings
    }, null, {
      sort: {
        postedAt: -1
      },
      limit: limit,
      skip: skip
    }).populate("userId").then(function (posts) {
      res.send({
        success: true,
        message: "Followings Posts",
        data: {
          posts: posts,
          pages: pages,
          totalCount: totalCount
        }
      });
    });
  })["catch"](function (err) {
    return res.send({
      success: false,
      message: "Can not fetch Followings Posts",
      data: err
    });
  });
}

var _default = {
  getByUserId: getByUserId,
  updatePost: updatePost,
  createPost: createPost,
  getById: getById,
  deletePost: deletePost,
  fetchFollowingsPosts: fetchFollowingsPosts
};
exports["default"] = _default;
module.exports = exports.default;
//# sourceMappingURL=post.js.map
