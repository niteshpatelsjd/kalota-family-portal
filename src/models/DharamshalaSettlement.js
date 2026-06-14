const mongoose = require("mongoose");

const DharamshalaSettlementSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      advanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_advance",
        required: true,
      },

      voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_voucher",
        required: true,
      },

      settlementNumber: {
        type: String,
        required: true,
        unique: true,
      },

      settlementDate: {
        type: Date,
        default: Date.now,
      },

      approvedAdvanceAmount: {
        type: Number,
        required: true,
      },

      totalExpenseAmount: {
        type: Number,
        default: 0,
      },

      totalReturnedAmount: {
        type: Number,
        default: 0,
      },

      reimbursementAmount: {
        type: Number,
        default: 0,
      },

      differenceAmount: {
        type: Number,
        default: 0,
      },

      remarks: {
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

      status: {
        type: String,
        enum: [
          "DRAFT",
          "PENDING_APPROVAL",
          "APPROVED",
          "REJECTED",
          "CLOSED",
        ],
        default: "DRAFT",
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
  "dharamshala_settlement",
  DharamshalaSettlementSchema
);