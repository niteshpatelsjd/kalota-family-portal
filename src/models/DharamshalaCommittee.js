const mongoose = require("mongoose");

const DharamshalaCommitteeSchema =
  new mongoose.Schema(
    {
      dharamshalaId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "dharamshala",
        required: true,
      },

      userId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },

      committeeRole: {
        type: String,
        enum: [
          "PRESIDENT",
          "VICE_PRESIDENT", 
          "TREASURER",
          "SECRETARY",
          "MEMBER",
        ],
        required: true,
      },

    //   rolePriority: {
    //     type: Number,
    //     default: 0,
    //   },

      joiningDate: {
        type: Date,
        required: true,
      },


      endDate: {
        type: Date,
        default: null,
      },

      remarks: String,

      appointedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
      },

      removedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "admin_user",
      },

      removedReason: String,

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
  "dharamshala_committee",
  DharamshalaCommitteeSchema
);