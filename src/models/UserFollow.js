const mongoose = require("mongoose");

const UserFollowSchema = new mongoose.Schema(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    followingId: {
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

UserFollowSchema.index(
  { followerId: 1, followingId: 1 },
  { unique: true }
);
UserFollowSchema.index({ followerId: 1, status: 1, createdAt: -1 });
UserFollowSchema.index({ followingId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("user_follow", UserFollowSchema);
