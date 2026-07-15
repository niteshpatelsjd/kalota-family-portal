const mongoose = require("mongoose");

const ReportSpamSchema = new mongoose.Schema(
  {
    feedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "feedModel",
    },

    feedModel: {
      type: String,
      required: true,
      enum: ["post", "post_comment"],
    },

    feedType: {
      type: String,
      required: true,
      enum: ["Post", "Comment"],
    },

    issueType: {
      type: String,
      required: true,
      trim: true,
    },

    descriptions: {
      type: String,
      default: "",
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
    },

    reportStatus: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
      // 1 = Pending, 2 = Open, 3 = Closed
    },
  },
  {
    timestamps: true,
  }
);

ReportSpamSchema.index({ feedId: 1, feedType: 1 });
ReportSpamSchema.index({ userId: 1, createdAt: -1 });
ReportSpamSchema.index({ reportStatus: 1, createdAt: -1 });
ReportSpamSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model(
  "report_spam",
  ReportSpamSchema
);
