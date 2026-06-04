const mongoose = require("mongoose");

const MemberSessionSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    sessionToken: { type: String, default: "" },
    deviceType: { type: String, default: "" },
    deviceToken: { type: String, default: "" },
    eventType: { type: String, default: "" },
    description: { type: String, default: "" },
    loginAt: { type: Date, default: null },
    logoutAt: { type: Date, default: null },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "member_sessions" }
);

module.exports = mongoose.model("MemberSession", MemberSessionSchema);
