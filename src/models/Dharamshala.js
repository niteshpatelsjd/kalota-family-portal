const mongoose = require("mongoose");

const DharamshalaSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
    type: {
      type: String,
      enum: ["DHARAMSHALA", "TRUST"],
      default: "DHARAMSHALA",
    },

        latitude: Number,
    longitude: Number,

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

      description: String,

      villageId: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Village",
      },
      address: String,


      mobileNumber: String,

      alternateMobileNumber: String,

      email: String,

      website: String,

      establishedYear: String,

      profileImage: String,

      bannerImage: String,


      status: {
        type: Number,
        default: 1,
      },


    },
    {
      timestamps: true,
    }
  );
DharamshalaSchema.index({ location: "2dsphere" });
module.exports = mongoose.model(
  "dharamshala",
  DharamshalaSchema
);