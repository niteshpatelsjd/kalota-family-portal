const UserDevice = require("../models/UserDevice");

async function createUserDevice(data) {
     if (data.id) {
    // update existing
    return await UserDevice.findOneAndUpdate(
      { _id: data.id },
      { $set: data },
      { upsert: true, new: true }
    );
  } else {
    // create new
    return await UserDevice.create(data);
  }
}
async function findByUserId(userId) {
  return await UserDevice.findOne({ userId: userId });
}


// 🔹 Delete all device tokens for a user (on logout)
async function deleteByUserId(userId) {
  return await UserDevice.deleteMany({ userId });
}

// 🔹 (Optional) Delete only a specific device token
async function deleteByUserIdAndToken(userId, deviceToken) {
  return await UserDevice.deleteOne({ userId, deviceToken });
}

async function upsertUserDevice(data) {
  return UserDevice.findOneAndUpdate(
    {
      userId: data.userId,
      deviceId: data.deviceId,
    },
    {
      userId: data.userId,
      deviceType: data.deviceType,
      deviceToken: data.deviceToken,
      deviceId: data.deviceId,
      notificationEnable: data.notificationEnable,
      status: data.status,
      updatedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
    }
  );
}

module.exports = {
  createUserDevice,
  findByUserId,
  deleteByUserId,
  deleteByUserIdAndToken, // optional
  upsertUserDevice,
};