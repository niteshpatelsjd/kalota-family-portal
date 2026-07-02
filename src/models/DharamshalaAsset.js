const mongoose = require("mongoose");

const DharamshalaAssetSchema =
  new mongoose.Schema(
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
          "HALL",
          "KITCHEN",
          "KITCHEN_EQUIPMENT",
          "KITCHEN_UTENSILS",
          "ELECTRICAL",
          "LIGHTING",
          "FURNITURE",
          "BEDDING",
          "WATER_SYSTEM",
          "WATER_SUPPLY",
          "PLUMBING",
          "CONSTRUCTION_MATERIAL",
          "FOOD_SERVE_ITEM",
          "FOOD_SERVING",
          "FOOD_GROCERY",
          "DRINKING_WATER",
          "CLEANING",
          "GARDEN",
          "PLANTS",
          "OFFICE",
          "VEHICLE",
          "CCTV",
          "SECURITY",
          "FIRE_SAFETY",
          "SOUND_SYSTEM",
          "IT_EQUIPMENT",
          "RELIGIOUS_ITEMS",
          "SPORTS",
          "MEDICAL",
          "UNIFORM",
          "TOOLS",
          "OTHER",
        ],
        required: true,
      },

      totalQuantity: {
        type: Number,
        default: 0,
      },

      availableQuantity: {
        type: Number,
        default: 0,
      },

      damagedQuantity: {
        type: Number,
        default: 0,
      },

      lostQuantity: {
        type: Number,
        default: 0,
      },

      disposedQuantity: {
        type: Number,
        default: 0,
      },

      unit: {
        type: String,
        default: "Piece",
      },

      totalPurchaseCost: {
        type: Number,
        default: 0,
      },

      currentValue: {
        type: Number,
        default: 0,
      },

      averageUnitPrice: {
        type: Number,
        min: 0,
        default: 0,
      },

      estimatedDonationValue: {
        type: Number,
        min: 0,
        default: 0,
      },

      condition: {
        type: String,
        enum: [
          "NEW",
          "GOOD",
          "AVERAGE",
          "DAMAGED",
          "REPAIR_REQUIRED",
          "SCRAP",
        ],
        default: "GOOD",
      },

      location: {
        type: String,
        default: "",
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
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_item",
        required: true,
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

module.exports = mongoose.model(
  "dharamshala_asset",
  DharamshalaAssetSchema
);
