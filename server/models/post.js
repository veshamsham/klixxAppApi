import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tripId: { type: Schema.Types.ObjectId, ref: "trip" },
  caption: { type: String, default: null },
  imageUrl: { type: String, default: null },
  tags: {
    type: [Schema.Types.ObjectId]
  },
  longAddress: { type: String, default: null },
  shortAddress: { type: String, default: null },
  loc: {
    type: [Number],
    index: "2d"
  },
  postedAt: { type: Date, default: Date.now() }
});

export default mongoose.model("post", PostSchema);
