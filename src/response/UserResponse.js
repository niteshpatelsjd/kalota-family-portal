// utils/userResponse.js
function buildUserResponse(user) {
  if (!user) return null;

  return {
    id: user._id,
    name: user.name || "",
    email: user.email || "",
    mobileNumber: user.mobileNumber || "",
    districtId: user.districtId || "",
    tehsilId: user.tehsilId || "",
    villageId: user.villageId || "",
    familyId: user.familyId || "",
    profileUrl: user.profileUrl || "",
    status: user.status,
    profileCompleted: user.profileCompleted || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}


function buildFullUserResponse(user, device = null) {
  if (!user) return null;

  return {
    id: user._id,
    name: user.name || "",
    email: user.email || "",
    mobileNumber: user.mobileNumber || "",
    districtId: user.districtId || "",
    tehsilId: user.tehsilId || "",
    villageId: user.villageId || "",
    familyId: user.familyId || "",
    profileUrl: user.profileUrl || "",
    status: user.status,
    profileCompleted: user.profileCompleted || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // 👇 Device info added directly
    deviceType: device ? device.deviceType : null,
    deviceToken: device ? device.deviceToken : null,
    voipToken: device? device.voipToken: null,
    notificationEnable: device ? device.notificationEnable : null,
  };
}

module.exports = {buildUserResponse,buildFullUserResponse};

