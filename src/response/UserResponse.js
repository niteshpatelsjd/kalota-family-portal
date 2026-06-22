// utils/userResponse.js
function buildUserResponse(user) {

  if (!user) return null;

  return {

    id: user._id,

    // Basic Details

    name:
      user.name || "",

    firstName:
      user.firstName || "",

    lastName:
      user.lastName || "",

    fatherFirstName:
      user.fatherFirstName || "",

    motherFirstName:
      user.motherFirstName || "",

    gender:
      user.gender || "",

    dob:
      user.dob || "",

    relationType:
      user.relationType || "",

    // Contact Details

    email:
      user.email || "",

    mobileNumber:
      user.mobileNumber || "",

    // Family Details

    familyId:
      user.familyId || "",

    familyHeadId:
      user.familyHeadId || "",

    // Location Details

    districtId:
      user.districtId?._id ||
      user.districtId ||
      "",

    districtName:
      user.districtId?.name ||
      "",

    tehsilId:
      user.tehsilId?._id ||
      user.tehsilId ||
      "",

    tehsilName:
      user.tehsilId?.name ||
      "",

    villageId:
      user.villageId?._id ||
      user.villageId ||
      "",

    villageName:
      user.villageId?.name ||
      "",

    // Profile

    profileUrl:
      user.profileUrl || "",

    descriptions:
      user.descriptions || "",

    // Status

    status:
      user.status || 1,

    profileCompleted:
      user.profileCompleted ||
      false,

    isVerified:
      user.isVerified ||
      false,

    verificationStatus:
      user.verificationStatus ||
      "PENDING",

    rejectedReason:
      user.rejectedReason || "",

    // Audit

    createdAt:
      user.createdAt,

    updatedAt:
      user.updatedAt,
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

