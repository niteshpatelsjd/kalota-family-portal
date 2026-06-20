const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "GENERAL",
        "FAMILY",
        "REGISTRATION",
        "DHARAMSHALA",
        "DONATION",
        "BOOKING",
        "PAYMENT",
        "SYSTEM",
      ],
      default: "GENERAL",
    },

    data: {
      type: Object,
      default: {},
    },

    imageUrl: {
      type: String,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    sentStatus: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },

    firebaseMessageId: {
      type: String,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },



    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1, // 1 active, 2 deleted
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "notification",
  NotificationSchema
);