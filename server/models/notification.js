import mongoose from "mongoose";

const Schema = mongoose.Schema;

const Notification = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hasRead: { type: Boolean, default: false },
    type: {
        type: String,
        enum: ['followed', 'post'],
    },
    toDisplayUser: { type: Schema.Types.ObjectId, ref: "User" },
    link: { type: String, default: null },
    date: { type: Date, default: Date.now() }
});

export default mongoose.model("notification", Notification);
