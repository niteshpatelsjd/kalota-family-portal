const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    latitude:  { type: Number, default: null },
    longitude: { type: Number, default: null },
    status: { type: Number, default: 1 }, // 0=deleted, 1=active, 2=inactive
  },
  { timestamps: true, collection: "districts" }
);

module.exports = mongoose.model("District", districtSchema);
