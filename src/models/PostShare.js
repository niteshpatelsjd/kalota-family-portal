const mongoose = require("mongoose");

const PostShareSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },

    sharedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    sharedToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    shareKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

PostShareSchema.index({ postId: 1 });
PostShareSchema.index({ sharedByUserId: 1 });
PostShareSchema.index({ sharedToUserId: 1 });

module.exports = mongoose.model("post_share", PostShareSchema);
