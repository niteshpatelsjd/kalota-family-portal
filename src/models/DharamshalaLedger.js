const mongoose = require("mongoose");

const DharamshalaLedgerSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },
      bankAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_bank_account"
      },
      voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_voucher",
        required: true,
      },
    voucherNumber: {
    type: String,
    required: true
    },
    ledgerNumber: {
      type: String,
      required: true,
      unique: true
    },

      transactionDate: {
        type: Date,
        default: Date.now,
      },

      transactionType: {
        type: String,
        enum: [
          "DEBIT",
          "CREDIT",
        ],
        required: true,
      },

      category: {
        type: String,
        enum: [
          "DONATION",
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

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      runningBalance: {
        type: Number,
        default: 0,
      },

      creditAmount: {
        type: Number,
        default: 0,
      },

      debitAmount: {
        type: Number,
        default: 0,
      },

      // Source account
      fromAccountType: {
        type: String,
        enum: [
          "BANK",
          "MEMBER",
          "DONOR",
          "VENDOR",
          "SYSTEM",
        ],
      },

      fromAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      // Destination account
      toAccountType: {
        type: String,
        enum: [
          "BANK",
          "MEMBER",
          "DONOR",
          "VENDOR",
          "SYSTEM",
        ],
      },

      toAccountId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      description: {
        type: String,
        default: "",
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
        required: true,
      },

      status: {
        type: String,
        enum: [
          "PENDING",
          "SUCCESS",
          "FAILED",
          "REVERSED",
        ],
        default: "SUCCESS",
      },
        committeeMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_committee",
        default: null
        },
      referenceNumber: {
        type: String,
        default: "",
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

DharamshalaLedgerSchema.index({
  dharamshalaId: 1,
  ledgerNumber: 1
});
DharamshalaLedgerSchema.index({
  dharamshalaId: 1,
  transactionDate: -1
});

DharamshalaLedgerSchema.index({
  bankAccountId: 1,
  runningBalance: -1
});

DharamshalaLedgerSchema.index({
  voucherId: 1
});

DharamshalaLedgerSchema.index({
  bankAccountId: 1
});

DharamshalaLedgerSchema.index({
  category: 1
});


DharamshalaLedgerSchema.pre("validate", function (next) {
  const amount = Number(this.amount || 0);

  if (this.transactionType === "CREDIT") {
    this.creditAmount = amount;
    this.debitAmount = 0;
  }

  if (this.transactionType === "DEBIT") {
    this.debitAmount = amount;
    this.creditAmount = 0;
  }

  next();
});
module.exports = mongoose.model(
  "dharamshala_ledger",
  DharamshalaLedgerSchema
);