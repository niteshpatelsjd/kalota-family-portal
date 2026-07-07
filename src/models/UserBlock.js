const mongoose = require("mongoose");

const UserBlockSchema = new mongoose.Schema(
  {
    blockerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },

    blockedAt: {
      type: Date,
      default: Date.now,
    },

    unblockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

UserBlockSchema.index(
  { blockerId: 1, blockedUserId: 1 },
  { unique: true }
);
UserBlockSchema.index({ blockerId: 1, status: 1 });
UserBlockSchema.index({ blockedUserId: 1, status: 1 });

module.exports = mongoose.model("user_block", UserBlockSchema);
