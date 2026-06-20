const mongoose = require("mongoose");

const UserDeviceSchema =
  new mongoose.Schema(
    {
      userId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },

      deviceType: {
        type: String,
        enum: ["ANDROID", "IOS"],
        required: true,
      },

      deviceId: {
        type: String,
        required: true,
      },

      deviceToken: {
        type: String,
        required: true,
      },

      notificationEnable: {
        type: Boolean,
        default: true,
      },

      status: {
        type: Number,
        default: 1,
      },
    },
    {
      timestamps: true,
    }
  );

UserDeviceSchema.index({
  userId: 1,
});

UserDeviceSchema.index({
  deviceToken: 1,
});

UserDeviceSchema.index({
  userId: 1,
  deviceId: 1,
});

module.exports = mongoose.model(
  "user_device",
  UserDeviceSchema
);