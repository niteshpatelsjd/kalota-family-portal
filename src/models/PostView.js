// models/PostView.js
const mongoose = require("mongoose");

const PostViewSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    deviceId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PostViewSchema.index({ postId: 1 });
PostViewSchema.index({ userId: 1 });
PostViewSchema.index({ postId: 1, userId: 1 });

module.exports = mongoose.model("post_view", PostViewSchema);