const mongoose = require("mongoose");

const DharamshalaReimbursementSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      settlementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_settlement",
        required: true,
      },

      voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_voucher",
        required: true,
      },

      reimbursementNumber: {
        type: String,
        required: true,
        unique: true,
      },

      committeeMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_committee",
        required: true,
      },

      reimbursementDate: {
        type: Date,
        default: Date.now,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      paidAmount: {
        type: Number,
        default: 0,
      },

      balanceAmount: {
        type: Number,
        default: 0,
      },

      reason: {
        type: String,
        default: "",
      },

      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
        default: null,
      },

      approvedAt: {
        type: Date,
        default: null,
      },

      paidAt: {
        type: Date,
        default: null,
      },

      remarks: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "APPROVED",
          "PARTIALLY_PAID",
          "PAID",
          "REJECTED",
          "CANCELLED",
        ],
        default: "PENDING",
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
  "dharamshala_reimbursement",
  DharamshalaReimbursementSchema
);