const mongoose = require("mongoose");

const DharamshalaSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
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

module.exports = mongoose.model(
  "dharamshala",
  DharamshalaSchema
);