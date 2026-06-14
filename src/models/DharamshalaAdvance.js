const mongoose = require("mongoose");

const DharamshalaAdvanceSchema =
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

      committeeMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_committee",
        required: true,
      },

      advanceNumber: {
        type: String,
        required: true,
        unique: true,
      },

      purpose: {
        type: String,
        required: true,
        trim: true,
      },

      approvedAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      utilizedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      returnedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      reimbursementAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      outstandingAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      advanceDate: {
        type: Date,
        default: Date.now,
      },

      expectedSettlementDate: {
        type: Date,
        default: null,
      },

      settledAt: {
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
          "OPEN",
          "PARTIALLY_SETTLED",
          "SETTLED",
          "OVERDUE",
          "CANCELLED",
        ],
        default: "OPEN",
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

  DharamshalaAdvanceSchema.index({
  dharamshalaId: 1,
  committeeMemberId: 1,
});

DharamshalaAdvanceSchema.index({
  voucherId: 1,
});

DharamshalaAdvanceSchema.index({
  status: 1,
});

DharamshalaAdvanceSchema.index({
  advanceDate: -1,
});

module.exports = mongoose.model(
  "dharamshala_advance",
  DharamshalaAdvanceSchema
);