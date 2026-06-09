const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], required: true },
    isMarried: { type: Boolean, default: false },
    fatherName: { type: String, trim: true, default: "" },
    grandFatherName: { type: String, trim: true, default: "" },
    sasurName: { type: String, trim: true, default: "" },
    grandSasurName: { type: String, trim: true, default: "" },
    district: { type: String, required: true, trim: true },
    tehsil: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    familyId: { type: String, required: true, index: true, trim: true },
    matchedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      default: null,
    },
    isFamilyHead: { type: Boolean, default: false },
    mobileMismatch: { type: Boolean, default: false },
    matchType: {
      type: String,
      enum: [
        "EXACT_PROFILE_MATCH",
        "HEAD_PROFILE_MOBILE_MISMATCH",
        "PROFILE_MOBILE_MISMATCH",
        "MANUAL_REVIEW",
      ],
      default: "MANUAL_REVIEW",
    },
    approvalStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: { type: String, trim: true, default: "" },
    status: { type: Number, default: 1 },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "members" }
);

MemberSchema.index({ familyId: 1, matchedProfileId: 1 });

module.exports = mongoose.model("Member", MemberSchema);
