const mongoose = require("mongoose");

const DharamshalaAssetTransactionSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_asset",
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
          "DONATION",
          "PURCHASE",
          "TRANSFER_IN",
          "TRANSFER_OUT",
          "DAMAGED",
          "LOST",
          "REPAIRED",
          "DISPOSED",
          "ADJUSTMENT_IN",
          "ADJUSTMENT_OUT",
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

      quantityBefore: {
        type: Number,
        default: 0,
      },

      quantityAfter: {
        type: Number,
        default: 0,
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

      transactionDate: {
        type: Date,
        default: Date.now,
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

      // DharamshalaAsset
itemId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "dharamshala_item",
  required: true,
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
  "dharamshala_asset_transaction",
  DharamshalaAssetTransactionSchema
);