const mongoose = require("mongoose");

const DharamshalaBookingUnitSchema = new mongoose.Schema(
  {
    dharamshalaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala",
      required: true,
    },

    unitName: {
      type: String,
      required: true,
      trim: true,
    },

    unitType: {
      type: String,
      enum: [
        "ROOM",
        "HALL",
        "KITCHEN",
        "DINING",
        "GROUND",
        "FULL_DHARAMSHALA",
        "OTHER",
      ],
      required: true,
    },

    capacity: {
      type: Number,
      default: 0,
    },

    totalUnits: {
      type: Number,
      default: 1,
      min: 1,
    },

    basePrice: {
      type: Number,
      default: 0,
    },

    securityDeposit: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

DharamshalaBookingUnitSchema.index({
  dharamshalaId: 1,
  unitType: 1,
  status: 1,
});
DharamshalaBookingUnitSchema.index({
  unitName: 1,
});

module.exports = mongoose.model(
  "dharamshala_booking_unit",
  DharamshalaBookingUnitSchema
);
