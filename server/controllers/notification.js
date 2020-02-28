import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { get } from "lodash";
import APIError from "../helpers/APIError";
import { fetchReturnObj } from "../service/transform-response";
import config from "../../config/env";
import Notification from '../models/notification';
import User from '../models/user';
import sendNotification from "../service/pushNotification";

function createNotification(type, data) {
    switch (type) {
        case 'followed':
            return saveInDB(data);
        case 'post':
            return makePostNotificationData(data);
    }
}

function makePostNotificationData(notifyData) {
    User.find({ followings: { $in: [notifyData.userId] } })
        .then(result => {
            let allPromises;
            const data = result.map(item => {
                sendNotification(item._id, 'New post by your friend');
                return new Notification({
                    userId: item._id,
                    type: 'post',
                    link: notifyData.postId,
                    toDisplayUser: notifyData.userId,
                    date: Date.now()
                })
            })
            saveInDB(data);
        })
        .catch(error => {
            console.log(error);
        })
}

function saveInDB(data) {
    if (Array.isArray(data)) {
        return Notification.insertMany(data);
    }
    sendNotification(data.userId, 'You have a new follower');

    const notification = new Notification(data);

    return notification.saveAsync().catch(error => {
        console.log(error)
    });
}

function getNotification(req, res, next) {
    let notifications;
    Notification.find({
        userId: req.user._id
    })
        .populate('toDisplayUser', 'fname lname userName profileUrl')
        .then(result => {
            notifications = result;
            Notification.updateMany(
                { userId: req.user._id },
                { hasRead: true }
            )
                .then(value => {
                    return res.send({
                        success: true,
                        message: 'Your Notification List',
                        data: notifications
                    })
                })
        })
        .catch(error => {
            return res.send({
                success: false,
                message: 'Failed to fetch your notification list',
                data: error
            })
        })
}

function markNotificationAsRead(req, res, next) {
    Notification.findOneAndUpdate({
        _id: req.params.id
    }, {
        hasRead: true
    }).then(result => {
        if (!result) {
            return res.send({
                success: false,
                message: 'Notification does not exist',
                data: {}
            })
        }
        return res.send({
            success: true,
            message: 'Marked as read',
            data: {}
        })
    }).catch(err => {
        return res.send({
            success: false,
            message: 'Failed to mark as read',
            data: err
        })
    })
}

function deleteNotification(req, res, next) {
    Notification.findOneAndDelete({
        _id: req.params.id
    }).then(result => {
        if (!result) {
            return res.send({
                success: false,
                message: 'Notification does not exist',
                data: {}
            })
        }
        return res.send({
            success: true,
            message: 'Notification deleted',
            data: {}
        })
    }).catch(err => {
        return res.send({
            success: false,
            message: 'Failed to delete notification',
            data: err
        })
    })
}

export default {
    createNotification,
    getNotification,
    markNotificationAsRead,
    deleteNotification
};
