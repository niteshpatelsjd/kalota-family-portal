const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    mobileNumber: { type: String, required: true },
    familyId: {
     type: mongoose.Schema.Types.ObjectId,
          ref: "Family",
          required: true,
        },
    familyHeadId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Person",
          required: true,
        },
    
        districtId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "District",
          required: true,
        },
    
        tehsilId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tehsil",
          required: true,
        },
    
        villageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Village",
          required: true,
        },
    
    profileUrl: String,
    descriptions: String,
    status: { type: Number, default: 1 },
    profileCompleted: {type : Boolean, default: false},
    isVerified: {
      type: Boolean,
      default: false
    },

    verificationStatus: {
      type: String,
      enum: [
          "PENDING",
          "APPROVED",
          "REJECTED"
      ],
      default: "PENDING"
    },

    rejectedReason: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
    
  },
 
);
module.exports = mongoose.model("user", UserSchema);
