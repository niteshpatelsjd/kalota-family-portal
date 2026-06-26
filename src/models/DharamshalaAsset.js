const mongoose = require("mongoose");

const DharamshalaAssetSchema = new mongoose.Schema(
  {
    dharamshalaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala",
      required: true,
    },

    assetNumber: {
      type: String,
      required: true,
      unique: true,
    },

    assetName: {
      type: String,
      required: true,
      trim: true,
    },

    assetCategory: {
      type: String,
      enum: [
        "LAND",
        "BUILDING",
        "ROOM",
        "KITCHEN",
        "ELECTRICAL",
        "FURNITURE",
        "BEDDING",
        "WATER_SYSTEM",
        "CONSTRUCTION_MATERIAL",
        "FOOD_SERVE_ITEM",
        "VEHICLE",
        "CCTV",
        "SOUND_SYSTEM",
        "IT_EQUIPMENT",
        "OTHER",
      ],
      required: true,
    },

    sourceType: {
      type: String,
      enum: ["DONATION", "PURCHASE", "TRANSFER", "SELF_CONSTRUCTED", "OTHER"],
      required: true,
    },

    donorName: {
      type: String,
      default: "",
    },

    donorMobile: {
      type: String,
      default: "",
    },

    supplierName: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      default: 1,
    },

    unit: {
      type: String,
      default: "Piece",
    },

    purchaseCost: {
      type: Number,
      default: 0,
    },

    currentValue: {
      type: Number,
      default: 0,
    },

    purchaseDate: {
      type: Date,
      default: null,
    },

    donationDate: {
      type: Date,
      default: null,
    },

    condition: {
      type: String,
      enum: ["NEW", "GOOD", "AVERAGE", "DAMAGED", "REPAIR_REQUIRED", "SCRAP"],
      default: "GOOD",
    },

    location: {
      type: String,
      default: "",
    },

    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala_expense",
      default: null,
    },

    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala_donation",
      default: null,
    },

    imageUrls: [
      {
        type: String,
      },
    ],

    remarks: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin_user",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin_user",
    },

    statusFlag: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("dharamshala_asset", DharamshalaAssetSchema);