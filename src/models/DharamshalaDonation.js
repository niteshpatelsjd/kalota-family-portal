const mongoose = require("mongoose");
const DharamshalaDonationSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      receiptNumber: {
        type: String,
        unique: true,
      },

      donorType: {
        type: String,
        enum: [
          "REGISTERED_MEMBER",
          "EXTERNAL_DONOR",
        ],
        required: true,
      },

      donorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null,
      },

      externalDonorName: {
        type: String,
        default: "",
      },

      externalMobileNumber: {
        type: String,
        default: "",
      },

      externalAddress: {
        type: String,
        default: "",
      },

      donationType: {
        type: String,
        enum: ["MONEY", "ITEM"],
        required: true,
      },

      amount: {
        type: Number,
        default: 0,
      },

      itemName: {
        type: String,
        default: "",
      },

      quantity: {
        type: Number,
        default: 0,
      },

      purpose: {
        type: String,
        required: true,
      },

      paymentMode: {
        type: String,
        enum: [
          "CASH",
          "UPI",
          "CHEQUE",
          "NEFT",
        ],
        required: true,
      },

      transactionReference: {
        type: String,
        default: "",
      },

      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
        required: false,
      },
      familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "family",
        required: false,
      },

      voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_voucher",
        default: null,
      },

      ledgerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_ledger",
        default: null,
      },

      depositStatus: {
        type: String,
        enum: [
          "PENDING",
          "DEPOSITED",
        ],
        default: "PENDING",
      },

      donationDate: {
        type: Date,
        default: Date.now,
      },

      remarks: {
        type: String,
        default: "",
      },

      status: {
        type: Number,
        enum: [0, 1, 2],
        default: 1,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
        default: null,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );
  module.exports = mongoose.model("dharamshala_donation", DharamshalaDonationSchema);