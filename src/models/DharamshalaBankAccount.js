const mongoose = require("mongoose");

const DharamshalaBankAccountSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      accountName: {
        type: String,
        required: true,
        trim: true,
      },

      bankName: {
        type: String,
        required: true,
        trim: true,
      },

      branchName: {
        type: String,
        default: "",
        trim: true,
      },

      accountNumber: {
        type: String,
        required: true,
        trim: true,
      },

      ifscCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },

      accountType: {
        type: String,
        enum: [
          "SAVINGS",
          "CURRENT",
          "TRUST",
          "OTHER",
        ],
        default: "TRUST",
      },

      openingBalance: {
        type: Number,
        default: 0,
        min: 0,
      },

      currentBalance: {
        type: Number,
        default: 0,
        min: 0,
      },

      balanceAsOn: {
        type: Date,
        default: Date.now,
      },

      isPrimary: {
        type: Boolean,
        default: true,
      },

      accountHolderName: {
        type: String,
        default: "",
        trim: true,
      },

      remarks: {
        type: String,
        default: "",
      },

      status: {
        type: Number,
        default: 1,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
      },
    },
    {
      timestamps: true,
    }
  );
DharamshalaBankAccountSchema.index(
 {
   dharamshalaId: 1,
   accountNumber: 1
 },
 { unique: true }
);
module.exports = mongoose.model(
  "dharamshala_bank_account",
  DharamshalaBankAccountSchema
);