const mongoose = require("mongoose");

const DharamshalaDonationSchema = new mongoose.Schema(
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
      enum: ["REGISTERED_MEMBER", "EXTERNAL_DONOR"],
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


    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "family",
      default: null,
    },

    donationSource: {
      type: String,
      enum: ["ONLINE", "COMMITTEE_COLLECTION", "DIRECT_OFFICE"],
      required: true,
      default: "COMMITTEE_COLLECTION",
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

    price: {
      type: Number,
      min: 0,
      default: 0,
    },

    estimatedUnitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },

    estimatedTotalValue: {
      type: Number,
      min: 0,
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

    receivedQuantity: {
      type: Number,
      default: 0,
    },

    purpose: {
      type: String,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["CASH", "UPI", "CHEQUE", "NEFT", "ONLINE", "NA"],
      default: "NA",
    },

    transactionReference: {
      type: String,
      default: "",
    },

    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    collectionStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "NOT_COLLECTED", "COLLECTED", "CANCELLED"],
      default: "NOT_COLLECTED",
    },

    depositStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING", "DEPOSITED", "CANCELLED"],
      default: "PENDING",
    },

    itemStatus: {
      type: String,
      enum: [
        "NOT_REQUIRED",
        "PENDING_VERIFICATION",
        "RECEIVED",
        "PARTIALLY_RECEIVED",
        "NOT_RECEIVED",
        "CANCELLED",
      ],
      default: "NOT_REQUIRED",
    },

    notReceivedReason: {
      type: String,
      default: "",
    },

    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala_bank_account",
      default: null,
    },

    bankReceiptUrl: {
      type: String,
      default: "",
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

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    donationDate: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      default: "",
    },

    cancelReason: {
      type: String,
      default: "",
    },

    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala_item",
      default: null,
    },
    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

DharamshalaDonationSchema.index({
  dharamshalaId: 1,
  status: 1,
  donationDate: -1,
});
DharamshalaDonationSchema.index({
  dharamshalaId: 1,
  status: 1,
  createdAt: -1,
});
DharamshalaDonationSchema.index({
  donorUserId: 1,
  status: 1,
  createdAt: -1,
});
DharamshalaDonationSchema.index({
  depositStatus: 1,
  status: 1,
  createdAt: -1,
});
DharamshalaDonationSchema.index({
  itemStatus: 1,
  status: 1,
  createdAt: -1,
});
DharamshalaDonationSchema.index({
  receiptNumber: 1,
});

module.exports = mongoose.model(
  "dharamshala_donation",
  DharamshalaDonationSchema
);
