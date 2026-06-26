const mongoose = require("mongoose");

const DharamshalaInventoryItemSchema = new mongoose.Schema(
  {
    dharamshalaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala",
      required: true,
    },

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

    category: {
      type: String,
      enum: [
        "FOOD",
        "GROCERY",
        "KITCHEN",
        "CLEANING",
        "CONSTRUCTION",
        "ELECTRICAL",
        "PLUMBING",
        "GARDEN",
        "STATIONERY",
        "OTHER",
      ],
      required: true,
    },

    unit: {
      type: String,
      default: "Piece",
    },

    currentStock: {
      type: Number,
      default: 0,
    },

    minimumStock: {
      type: Number,
      default: 0,
    },

    location: {
      type: String,
      default: "",
    },

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

module.exports = mongoose.model(
  "dharamshala_inventory_item",
  DharamshalaInventoryItemSchema
);