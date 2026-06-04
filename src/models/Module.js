const mongoose = require("mongoose");

const ModuleSchema = new mongoose.Schema(
  {
    moduleName: { type: String, required: true },
    parentModuleName: { type: String },
    moduleCode: { type: String, required: true },
    moduleAction: { type: Number, default: 0 },
    addAction: { type: Number, default: 0 },
    updateAction: { type: Number, default: 0 },
    deleteAction: { type: Number, default: 0 },
    downloadAction: { type: Number, default: 0 },
    viewAction: { type: Number, default: 0 },
    status: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: "modules" }
);

module.exports = mongoose.model("modules", ModuleSchema);
