const mongoose =
  require("mongoose");

const DharamshalaExpenseSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      voucherId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_voucher",
        required: true,
      },

      ledgerId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_ledger",
      },

      expenseNumber: {
        type: String,
        required: true,
        unique: true,
      },

      expenseDate: {
        type: Date,
        default: Date.now,
      },

      expenseType: {
        type: String,
        enum: [
          "UTILITY",
          "LABOUR",
          "SALARY",
          "RENT",
          "MAINTENANCE",
          "PURCHASE",
          "CONSTRUCTION",
          "TRAVEL",
          "FOOD",
          "OTHER",
        ],
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      vendorName: {
        type: String,
        default: "",
      },

      vendorMobile: {
        type: String,
        default: "",
      },

      billNumber: {
        type: String,
        default: "",
      },

      billDate: {
        type: Date,
      },

      amount: {
        type: Number,
        required: true,
        default: 0,
      },
bankAccountId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "dharamshala_bank_account",
  default: null,
},

expenseSource: {
  type: String,
  enum: ["DIRECT_BANK", "AGAINST_ADVANCE"],
  default: "DIRECT_BANK",
},

paymentMode: {
  type: String,
  enum: [
    "CASH",
    "BANK",
    "UPI",
    "CHEQUE",
    "NEFT",
    "ADVANCE",
  ],
  default: "BANK",
},
itemId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "dharamshala_item",
  default: null,
},
      description: {
        type: String,
        default: "",
      },

      attachmentUrls: [
        {
          type: String,
        },
      ],

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
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

module.exports =
  mongoose.model(
    "dharamshala_expense",
    DharamshalaExpenseSchema
  );