const mongoose =
  require("mongoose");

const DharamshalaExpenseItemSchema =
  new mongoose.Schema(
    {
      expenseId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_expense",
        required: true,
      },

      itemType: {
        type: String,
        enum: [
          "MATERIAL",
          "LABOUR",
          "TRANSPORT",
          "SERVICE",
          "OTHER",
        ],
        default: "MATERIAL",
      },

      itemName: {
        type: String,
        required: true,
        trim: true,
      },

      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dharamshala_item",
        default: null,
      },

      quantity: {
        type: Number,
        default: 1,
      },

      unit: {
        type: String,
        default: "",
      },

      rate: {
        type: Number,
        default: 0,
      },

      amount: {
        type: Number,
        required: true,
      },

      remarks: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "dharamshala_expense_item",
    DharamshalaExpenseItemSchema
  );
