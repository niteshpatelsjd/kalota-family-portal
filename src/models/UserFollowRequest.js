const mongoose = require("mongoose");

const UserFollowRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UserFollowRequestSchema.index(
  { requesterId: 1, targetUserId: 1 },
  { unique: true }
);
UserFollowRequestSchema.index({ targetUserId: 1, status: 1, createdAt: -1 });
UserFollowRequestSchema.index({ requesterId: 1, status: 1, createdAt: -1 });
UserFollowRequestSchema.index({ requesterId: 1, targetUserId: 1, status: 1 });
UserFollowRequestSchema.index({ targetUserId: 1, requesterId: 1, status: 1 });

module.exports = mongoose.model(
  "user_follow_request",
  UserFollowRequestSchema
);
