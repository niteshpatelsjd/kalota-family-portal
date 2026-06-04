const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roleId: String,
  countryCode: String,
  mobileNumber: {
    type: String,
    unique: true,
    required: false,
  },
  address: String,
  city: String,
  country: String,
  profileUrl: String,
  status: {
    type: Number,
    default: 0,
  },
  profileCompleted: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("admin_user", AdminUserSchema);