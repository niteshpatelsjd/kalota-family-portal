// models/Post.js
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    mediaUrls: [
      {
        type: String,
      },
    ],

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // or mobile_user if mobile users post
      required: true,
    },

    dharamshalaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala",
      default: null,
    },

    type: {
      type: String,
      enum: ["POST", "EVENT"],
      default: "POST",
    },

    eventDate: {
      type: Date,
      default: null,
    },

    likeCount: {
      type: Number,
      default: 0,
    },

    commentCount: {
      type: Number,
      default: 0,
    },

    shareCount: {
      type: Number,
      default: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
      // 0 = deleted, 1 = active, 2 = blocked
    },

  },
  {
    timestamps: true,
  }
);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ dharamshalaId: 1, createdAt: -1 });
PostSchema.index({ type: 1, createdAt: -1 });
PostSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("post", PostSchema);