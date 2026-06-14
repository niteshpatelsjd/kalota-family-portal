const mongoose = require("mongoose");

const DharamshalaDonationSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_voucher",
        required: true,
      },

      voucherNumber: {
        type: String,
        required: true,
      },

      donationNumber: {
        type: String,
        required: true,
        unique: true,
      },

      donorName: {
        type: String,
        required: true,
        trim: true,
      },

      mobileNumber: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      donationDate: {
        type: Date,
        default: Date.now,
      },

      donationType: {
        type: String,
        enum: [
          "GENERAL",
          "ANNADAN",
          "BUILDING",
          "RENOVATION",
          "EVENT",
          "CORPUS",
          "OTHER",
        ],
        default: "GENERAL",
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      paymentMode: {
        type: String,
        enum: [
          "CASH",
          "UPI",
          "BANK_TRANSFER",
          "CHEQUE",
          "OTHER",
        ],
        required: true,
      },

      referenceNumber: {
        type: String,
        default: "",
      },

      receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_committee",
        default: null,
      },

      bankAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_bank_account",
        default: null,
      },

      depositedAmount: {
        type: Number,
        default: 0,
      },

      pendingAmount: {
        type: Number,
        default: 0,
      },

      depositDate: {
        type: Date,
        default: null,
      },

      remarks: {
        type: String,
        default: "",
      },

      attachments: [
        {
          fileUrl: String,
          fileName: String,
        },
      ],

      status: {
        type: String,
        enum: [
          "RECEIVED",
          "PENDING_DEPOSIT",
          "PARTIALLY_DEPOSITED",
          "DEPOSITED",
          "CANCELLED",
        ],
        default: "RECEIVED",
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
        required: true,
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
  "dharamshala_donation",
  DharamshalaDonationSchema
);