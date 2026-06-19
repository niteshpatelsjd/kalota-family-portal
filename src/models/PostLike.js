// models/PostLike.js
const mongoose = require("mongoose");

const PostLikeSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

PostLikeSchema.index(
  { postId: 1, userId: 1 },
  { unique: true }
);

PostLikeSchema.index({ postId: 1 });

module.exports = mongoose.model("post_like", PostLikeSchema);