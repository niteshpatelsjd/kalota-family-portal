// models/PostComment.js
const mongoose = require("mongoose");

const PostCommentSchema = new mongoose.Schema(
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

    comment: {
      type: String,
      required: true,
      trim: true,
    },

    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post_comment",
      default: null,
    },

    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

PostCommentSchema.index({ postId: 1, createdAt: -1 });
PostCommentSchema.index({ userId: 1 });

module.exports = mongoose.model(
  "post_comment",
  PostCommentSchema
);