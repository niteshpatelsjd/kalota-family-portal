const mongoose = require("mongoose");

const DharamshalaInventoryTransactionSchema = new mongoose.Schema(
  {
    dharamshalaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala",
      required: true,
    },

    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala_inventory_item",
      required: true,
    },

    transactionNumber: {
      type: String,
      required: true,
      unique: true,
    },

    transactionType: {
      type: String,
      enum: [
        "OPENING",
        "PURCHASE",
        "DONATION",
        "CONSUMPTION",
        "DAMAGE",
        "LOST",
        "RETURN",
        "ADJUSTMENT",
      ],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      default: "Piece",
    },

    rate: {
      type: Number,
      default: 0,
    },

    amount: {
      type: Number,
      default: 0,
    },

    stockBefore: {
      type: Number,
      default: 0,
    },

    stockAfter: {
      type: Number,
      default: 0,
    },

    sourceType: {
      type: String,
      enum: ["DONATION", "PURCHASE", "MANUAL", "EXPENSE", "OTHER"],
      default: "MANUAL",
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

    referenceNumber: {
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
  "dharamshala_inventory_transaction",
  DharamshalaInventoryTransactionSchema
);