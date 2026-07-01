const mongoose = require("mongoose");

const DharamshalaItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedName: {
      type: String,
      required: true,
      trim: true,
    },

    itemNature: {
      type: String,
      enum: ["ASSET", "INVENTORY"],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "LAND",
        "BUILDING",
        "ROOM",
        "HALL",
        "FURNITURE",
        "BEDDING",
        "KITCHEN_EQUIPMENT",
        "KITCHEN_UTENSILS",
        "FOOD_SERVING",
        "FOOD_GROCERY",
        "DRINKING_WATER",
        "ELECTRICAL",
        "LIGHTING",
        "WATER_SUPPLY",
        "PLUMBING",
        "CLEANING",
        "CONSTRUCTION_MATERIAL",
        "GARDEN",
        "PLANTS",
        "OFFICE",
        "IT_EQUIPMENT",
        "SECURITY",
        "FIRE_SAFETY",
        "SOUND_SYSTEM",
        "VEHICLE",
        "RELIGIOUS_ITEMS",
        "SPORTS",
        "MEDICAL",
        "UNIFORM",
        "TOOLS",
        "OTHER",
      ],
      default: "OTHER",
    },

    defaultUnit: {
      type: String,
      default: "Piece",
    },

    description: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin_user",
      default: null,
      set: (value) => value || null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin_user",
      default: null,
      set: (value) => value || null,
    },

    statusFlag: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
  },
  { timestamps: true }
);

DharamshalaItemSchema.index(
  {
    normalizedName: 1,
    itemNature: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("dharamshala_item", DharamshalaItemSchema);
