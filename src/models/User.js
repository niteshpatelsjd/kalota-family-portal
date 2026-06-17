const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: String,

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    fatherFirstName: {
      type: String,
      trim: true,
    },

    motherFirstName: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },

    dob: String,

    relationType: {
      type: String,
      enum: [
        "HEAD",
        "SPOUSE",
        "SON",
        "DAUGHTER",
        "FATHER",
        "MOTHER",
        "BROTHER",
        "SISTER",
        "GRANDFATHER",
        "GRANDMOTHER",
        "GRANDSON",
        "GRANDDAUGHTER",
        "UNCLE",
        "AUNT",
        "OTHER",
      ],
    },

    email: String,

    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },

    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },

    familyHeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true,
    },

    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },

    tehsilId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tehsil",
      required: true,
    },

    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Village",
      required: true,
    },

    profileUrl: String,

    descriptions: String,

    status: {
      type: Number,
      default: 1,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
      ],
      default: "PENDING",
    },

    rejectedReason: String,

    status: { type: Number, default: 1 },
    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", UserSchema);