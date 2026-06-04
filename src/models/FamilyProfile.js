const mongoose = require("mongoose");

const spouseDetailSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    district: { type: String, trim: true },
    tehsil: { type: String, trim: true },
    village: { type: String, trim: true },
    familyId: { type: String, trim: true },
  },
  { _id: false }
);

const FamilyProfileSchema = new mongoose.Schema(
  {
    familyId: { type: String, required: true, index: true, trim: true },
    relationToHead: {
      type: String,
      required: true,
      enum: [
        "HEAD",
        "FATHER",
        "MOTHER",
        "SPOUSE",
        "SISTER",
        "SON",
        "DAUGHTER",
        "GRANDSON",
        "GRANDDAUGHTER",
        "OTHER",
      ],
    },
    name: { type: String, required: true, trim: true },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER", ""], default: "" },
    isMarried: { type: Boolean, default: false },
    profileImage: { type: String, default: "" },
    occupation: { type: String, trim: true, default: "" },
    education: { type: String, trim: true, default: "" },
    mobileNumber: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    fatherName: { type: String, trim: true, default: "" },
    motherName: { type: String, trim: true, default: "" },
    grandFatherName: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    tehsil: { type: String, trim: true, default: "" },
    village: { type: String, trim: true, default: "" },
    parentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyProfile",
      default: null,
    },
    spouseDetails: [spouseDetailSchema],
    spouseFamilyId: { type: String, trim: true, default: "" },
    linkedMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true, collection: "family_profiles" }
);

FamilyProfileSchema.index({ familyId: 1, relationToHead: 1 });
FamilyProfileSchema.index({ familyId: 1, name: 1, fatherName: 1, dob: 1 });

module.exports = mongoose.model("FamilyProfile", FamilyProfileSchema);
