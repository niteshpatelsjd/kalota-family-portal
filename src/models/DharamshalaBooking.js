const mongoose = require("mongoose");

const DharamshalaBookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    dharamshalaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala",
      required: true,
    },

    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dharamshala_booking_unit",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    familyId: {
      type: String,
      default: "",
      trim: true,
    },

    eventType: {
      type: String,
      default: "OTHER",
      trim: true,
    },

    bookingFromDate: {
      type: Date,
      required: true,
    },

    bookingToDate: {
      type: Date,
      required: true,
    },

    checkInTime: {
      type: String,
      default: "",
      trim: true,
    },

    checkOutTime: {
      type: String,
      default: "",
      trim: true,
    },

    guestCount: {
      type: Number,
      default: 0,
    },

    purpose: {
      type: String,
      default: "",
      trim: true,
    },

    bookingAmount: {
      type: Number,
      default: 0,
    },

    securityDeposit: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    balanceAmount: {
      type: Number,
      default: 0,
    },

    bookingStatus: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: 1,
      // 1 Pending, 2 Approved, 3 Rejected, 4 Cancelled, 5 Completed
    },

    paymentStatus: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
      // 1 Unpaid, 2 Partially Paid, 3 Paid, 4 Refunded
    },

    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
    },

    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    actionAt: {
      type: Date,
      default: null,
    },

    actionType: {
      type: String,
      enum: ["", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"],
      default: "",
      trim: true,
    },

    actionDescriptions: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

DharamshalaBookingSchema.index({
  bookingNumber: 1,
});
DharamshalaBookingSchema.index({
  dharamshalaId: 1,
  unitId: 1,
  bookingFromDate: 1,
  bookingToDate: 1,
});
DharamshalaBookingSchema.index({
  userId: 1,
  createdAt: -1,
});
DharamshalaBookingSchema.index({
  bookingStatus: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "dharamshala_booking",
  DharamshalaBookingSchema
);
