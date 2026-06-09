// models/Family.js

const mongoose = require("mongoose");

const familySchema = new mongoose.Schema(
  {
    familyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    familyTitle: {
      type: String,
      trim: true,
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

    totalMembers: {
      type: Number,
      default: 1,
    },

    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  {
    timestamps: true,
  }
);

familySchema.index({
  familyId: 1,
});

familySchema.index({
  districtId: 1,
  tehsilId: 1,
  villageId: 1,
});

module.exports = mongoose.model(
  "Family",
  familySchema
);