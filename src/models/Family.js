const mongoose = require("mongoose");

const FamilySchema = new mongoose.Schema(
  {
    familyId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    headProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyProfile",
      default: null,
    },
    district: { type: String, required: true, trim: true },
    tehsil: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    status: { type: Number, default: 1 }, // 0=deleted, 1=active, 2=inactive
  },
  { timestamps: true, collection: "families" }
);

module.exports = mongoose.model("Family", FamilySchema);
