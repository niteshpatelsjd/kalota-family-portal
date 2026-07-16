const mongoose = require("mongoose");

const DharamshalaVoucherSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      
        committeeMemberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dharamshala_committee",
            default: null,
            },

      voucherNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      settledAmount: {
        type: Number,
        default: 0
        },
      // Accounting Type
      voucherType: {
        type: String,
        enum: [
          "RECEIPT", // Money coming in
          "PAYMENT", // Money going out
          "JOURNAL", // Adjustment entries
        ],
        required: true,
      },



      // Business Category
      category: {
        type: String,
        enum: [
          "DONATION",
          "BOOKING",
          "ADVANCE",
          "EXPENSE",
          "RETURN",
          "REIMBURSEMENT",
          "BANK_CHARGE",
          "BANK_INTEREST",
          "ADJUSTMENT",
          "OPENING_BALANCE",
          "OTHER",
        ],
        required: true,
      },

      purpose: {
        type: String,
        required: true,
        trim: true,
      },

      requestedAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      approvedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },

      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
        required: true,
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

      remarks: {
        type: String,
        default: "",
      },

      attachments: [
        {
          fileUrl: String,
          fileName: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      status: {
        type: String,
        enum: [
          "DRAFT",
          "PENDING",
          "APPROVED",
          "REJECTED",
          "PARTIALLY_SETTLED",
          "SETTLED",
          "CANCELLED",
        ],
        default: "DRAFT",
      },

      statusReason: {
        type: String,
        default: "",
      },

      statusUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
        default: null,
      },

      lastSettlementDate: {
        type: Date,
        default: null,
      },
      statusUpdatedAt: {
        type: Date,
        default: null,
      },
      voucherDate: {
        type: Date,
        default: Date.now,
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
  "dharamshala_voucher",
  DharamshalaVoucherSchema
);