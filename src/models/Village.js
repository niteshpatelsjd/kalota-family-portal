const mongoose = require("mongoose");

const villageSchema = new mongoose.Schema(
  {
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'District',
    },
    tehsilId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Tehsil',
    },
    name: { type: String, required: true, trim: true },
    latitude:  { type: Number, default: null },
    longitude: { type: Number, default: null },
    status: { type: Number, default: 1 }, // 0=deleted, 1=active, 2=inactive
  },
  { timestamps: true, collection: "villages" }
);

module.exports = mongoose.model("Village", villageSchema);
