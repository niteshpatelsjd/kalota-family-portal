const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    district: { type: String, required: true, trim: true },
    tehsil:   { type: String, required: true, trim: true },
    village:  { type: String, required: true, trim: true },
    latitude:  { type: Number, default: null },
    longitude: { type: Number, default: null },
    status: { type: Number, default: 1 }, // 0=deleted, 1=active, 2=inactive
  },
  { timestamps: true, collection: "locations" }
);

module.exports = mongoose.model("Location", locationSchema);
