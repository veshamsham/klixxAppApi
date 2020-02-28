import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";
import { get } from "lodash";
import formidable from "formidable";
import APIError from "../helpers/APIError";
import { fetchReturnObj } from "../service/transform-response";
import PostSchema from "../models/post";
import User from "../models/user";
import config from "../../config/env";
import ServerConfig from "../models/serverConfig";
import post from "../models/post";
import notificationCtrl from "./notification";

/**
 * Return the post details of the user.
 * @param req
 * @param res
 * @param next
 * @returns
 */

function decode(token) {
  return jwt.decode(token, config.jwtSecret);
}

function tokenFromHeaders(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "JWT"
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return "";
}

/**
 * Get getCloudinaryDetails
 * @returns {Cloudinary Details}

 */
function getCloudinaryDetails() {
  return new Promise((resolve, reject) => {
    ServerConfig.findOneAsync({ key: "cloudinaryConfig" })
      .then(foundDetails => {
        resolve(foundDetails.value);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getByUserId(req, res, next) {
  let userId = get(req.query, "userId");
  if (!userId) {
    userId = get(req.user, "_id");
  }
  const pageNo = parseInt(get(req.query, "pageNo", 1));
  const limit = parseInt(get(req.query, "limit", 20));
  const skip = (pageNo - 1) * limit;
  let pages;
  let totalCount;
  PostSchema.find({ userId })
    .then(result => {
      pages = result.length < limit ? 1 : Math.ceil(result.length / limit);
      totalCount = result.length;
      PostSchema.find({ userId }, null, {
        sort: { postedAt: -1 },
        limit,
        skip
      })
        .populate("userId", "fname lname userName profileUrl")
        .then(posts => {
          return res.send({
            success: true,
            data: {
              posts,
              pages,
              totalCount
            },
            message: "Fetched all post by user"
          });
        });
    })
    .catch(e => {
      return res.send({
        success: false,
        data: e,
        message: "failed to fetch all post by user"
      });
    });
}

function getById(req, res, next) {
  const id = req.params.id;

  PostSchema.findOne({ _id: id })
    .populate("userId", "fname lname userName profileUrl")
    .then(result => {
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
    })
    .catch(e => {
      return res.send({
        success: false,
        data: e,
        message: "falied to fetch post by ID"
      });
    });
}

function updatePost(req, res, next) {
  res.send({ hello: "asdsa" });
}

function deletePost(req, res, next) {
  const { id } = req.params;
  PostSchema.remove({ _id: id })
    .then(result => {
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
    })
    .catch(e => {
      return res.send({
        success: false,
        data: e,
        message: "Falied to delete post by ID"
      });
    });
}

function createPost(req, res, next) {
  const token = tokenFromHeaders(req);
  const userData = decode(token);

  getCloudinaryDetails()
    .then(value => {
      if (value) {
        cloudinary.config({
          cloud_name: value.cloud_name,
          api_key: value.api_key,
          api_secret: value.api_secret
        });
        const form = new formidable.IncomingForm();
        form.on("error", err => {
          console.error(err, "error heree"); //eslint-disable-line
        });

        form.parse(req, (err, fields, files) => {
          const img = get(files, "image.path", "");
          cloudinary.v2.uploader.upload(img, (error, results) => {
            if (error) {
              return res.send({
                success: false,
                message: "Image Not Found"
              });
            }
            if (results) {
              PostSchema.create({
                imageUrl: results.url,
                userId: get(userData, "_id", ""),
                caption: fields.caption,
                longAddress: fields.longAddress,
                shortAddress: fields.shortAddress,
                loc: !fields.loc ? undefined : JSON.parse(fields.loc),
                postedAt: Date.now()
              })
                .then(data => {
                  const notificationData = {
                    userId: req.user._id,
                    postId: data._id
                  };
                  notificationCtrl.createNotification("post", notificationData);
                  res.send({
                    success: true,
                    message: "image uplaoded"
                  });
                })
                .catch(e => {
                  res.send({
                    success: false,
                    message: "failed to upload"
                  });
                });
            }
          });
        });
      }
    })
    .catch(e => {
      const err = new APIError(
        `Error occured while updatating trip object ${e}`,
        httpStatus.INTERNAL_SERVER_ERROR
      );
      next(err);
    });
}

function fetchFollowingsPosts(req, res, next) {
  const followings = get(req.user, "followings", []);
  const pageNo = parseInt(get(req.query, "pageNo", 1));
  const limit = parseInt(get(req.query, "limit", 10));
  const skip = (pageNo - 1) * limit;
  let pages;
  let totalCount;
  PostSchema.find({
    userId: followings
  })
    .then(result => {
      pages = result.length < limit ? 1 : Math.ceil(result.length / limit);
      totalCount = result.length;
      PostSchema.find({ userId: followings }, null, {
        sort: { postedAt: -1 },
        limit,
        skip
      })
        .populate("userId")
        .then(posts => {
          res.send({
            success: true,
            message: "Followings Posts",
            data: {
              posts,
              pages,
              totalCount
            }
          });
        });
    })
    .catch(err => {
      return res.send({
        success: false,
        message: "Can not fetch Followings Posts",
        data: err
      });
    });
}

export default {
  getByUserId,
  updatePost,
  createPost,
  getById,
  deletePost,
  fetchFollowingsPosts
};
