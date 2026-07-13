const mongoose = require("mongoose");
const userRepo = require("../repositories/UserRepository");
const userDeviceRepo = require("../repositories/UserDeviceRepository");
const redis = require("../config/RedisConfig");
const jwtUtil = require("../utils/JwtUtil");
const { uploadFile } = require("../utils/FileUtil");
const AdminUser = require("../models/AdminUser");
const DharamshalaCommittee = require("../models/DharamshalaCommittee");
const uploadToCloudinary =
  require(
    "../utils/CloudnaryUploadUtil"
  );
const buildResponse = require("../utils/response");
const userResponse = require("../response/UserResponse");
const logger = require("../utils/logger");
const User = require("../models/User");
const Family = require("../models/Family");
const Person = require("../models/Person");
const UserDevice = require("../models/UserDevice");
const userCacheService = require("../redis/UserCacheService");

const userSessionRepo = require("../repositories/UserSessionRepository");
const SESSION_EVENTS = require("../constants/SessionEvents");
const UserSession = require("../models/UserSession");
const visibilityService = require("./UserVisibilityService");


async function updateProfile(id, updates, file) {
  try {
    logger.info(`updateProfile: userId=${id}`);

    let profileUrl;

        if (file) {
          try {
            const uploaded =
                await uploadToCloudinary(
                  file.path,
                  "kalota/profiles"
                );

              profileUrl =
                uploaded?.url || null;
        logger.info(`📸 Uploaded media file: ${profileUrl}`);
      } catch (err) {
        logger.error("❌ Failed to upload media file", {
          error: err.message,
        });
      }
    }

    const safeUpdates = {
      ...updates,
      profileUrl,
      profileCompleted: true
    };

    const updated = await userRepo.updateUser(id, safeUpdates);

    if (!updated) {
      logger.warn(`updateProfile: User not found id=${id}`);
      return buildResponse(404, "User not found", null);
    }

    const user = userResponse.buildUserResponse(updated);

    logger.info("User response: ", { user });
    // 👇 Get latest device by userId
    //const device = await UserDevice.findOne({ id }).sort({ createdAt: -1 });

    const device = await userDeviceRepo.findByUserId(id);
    const response =  userResponse.buildFullUserResponse(user, device);

    try {
      logger.info("User response generated", { response });

      await userCacheService.cacheUser(response);

      logger.info("User cached successfully", {
        userId: id
      });

    } catch (err) {
      logger.error("Error while caching user", {
        error: err.message,
        response
      });
    }

    return buildResponse(200, "User profile updated successfully", user);

  } catch (err) {
    logger.error("updateProfile error", {
      error: err.message,
      userId: id
    });

    return buildResponse(500, err.message, null);
  }
}

async function updateProfileImageService(body, file) {
  try {
    logger.info(
      `Starting updateProfileImageService with body: ${JSON.stringify(body)}`
    );

    const { userId } = body;

    if (!userId) {
      return buildResponse(
        403,
        "userId is required"
      );
    }

    if (!file) {
      return buildResponse(
        403,
        "profile image is required"
      );
    }

    const user = await User.findOne({
      _id: userId,
      status: 1,
    });

    if (!user) {
      return buildResponse(
        404,
        "User not found"
      );
    }

        let profileUrl = null;

        if (file) {
          const uploaded =
            await uploadToCloudinary(
              file.path,
              "kalota/profiles"
            );

          profileUrl =
            uploaded?.url || null;
        }

    user.profileUrl = profileUrl;
    user.updatedAt = new Date();

    await user.save();

    logger.info(
      `Profile image updated successfully for userId: ${userId}`
    );

    return buildResponse(
      200,
      "Profile image updated successfully",
      {
        id: user._id,
        name: user.name,
        profileUrl: user.profileUrl,
      }
    );
  } catch (error) {
    logger.error(
      `updateProfileImageService error: ${error.message}`,
      error
    );

    return buildResponse(
      500,
      "Something went wrong"
    );
  }
}

async function requestOtp( mobileNumber) {
  logger.info(`requestOtp for ${mobileNumber}`);

  // Check user status
  const user = await User.findOne({
    mobileNumber,
  });

  if (user && user.status === 2) {
    return buildResponse(
      403,
      "Your account is inactive. Please contact administrator.",
      null
    );
  }

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Store OTP in Redis (5 min)
  await redis.set(
    `otp:${mobileNumber}`,
    otp,
    "EX",
    300
  );

  return buildResponse(
    200,
    "OTP sent successfully",
    otp
  );
}

async function getCommitteeAccessByMobileUserId(mobileUserId) {
  try {
    const defaultAccess = {
      isCommitteeMember: false,
      userId: null,
      role: null,
      roles: [],
      dharamshalaIds: [],
      committeeMembers: [],
      permissions: {
        canApproveFamily: false,
        canViewFinance: false,
        canManageDonation: false,
      },
    };

    if (!mobileUserId) {
      return defaultAccess;
    }

    const committees = await DharamshalaCommittee.find({
      userId: mobileUserId,
      status: 1,
    }).lean();

    if (!committees.length) {
      return defaultAccess;
    }

    const roles = committees.map((c) => c.committeeRole);

    let primaryRole = roles[0];

    if (roles.includes("PRESIDENT")) {
      primaryRole = "PRESIDENT";
    } else if (roles.includes("VICE_PRESIDENT")) {
      primaryRole = "VICE_PRESIDENT";
    } else if (roles.includes("SECRETARY")) {
      primaryRole = "SECRETARY";
    } else if (roles.includes("TREASURER")) {
      primaryRole = "TREASURER";
    }

    return {
      isCommitteeMember: true,
      userId: mobileUserId,
      role: primaryRole,
      roles,
      dharamshalaIds: committees.map((c) => c.dharamshalaId),
      committeeMembers: committees.map((c) => ({
        committeeId: c._id,
        dharamshalaId: c.dharamshalaId,
        committeeRole: c.committeeRole,
      })),
      permissions: {
        canApproveFamily: true,
        canViewFinance: true,
        canManageDonation: true,
      },
    };
  } catch (error) {
    logger.error("getCommitteeAccessByMobileUserId error", {
      error: error.message,
      stack: error.stack,
      mobileUserId,
    });

    return {
      isCommitteeMember: false,
      userId: null,
      role: null,
      roles: [],
      dharamshalaIds: [],
      committeeMembers: [],
      permissions: {
        canApproveFamily: false,
        canViewFinance: false,
        canManageDonation: false,
      },
    };
  }
}
// 🟢 Verify OTP
async function verifyOtp(
  mobileNumber,
  otp,
  deviceType,
  deviceToken,
  deviceId
) {
  const key = `otp:${mobileNumber}`;

  logger.info(`verifyOtp started for ${key}`);

  logger.info(
    `Device Info Received => deviceType: ${deviceType || "NULL"}, deviceId: ${
      deviceId || "NULL"
    }, deviceToken: ${
      deviceToken
        ? deviceToken.substring(0, 30) + "..."
        : "NULL"
    }`
  );

  try {
    const stored = await redis.get(key);

    if (!stored || stored !== otp) {
      logger.warn(
        `verifyOtp: invalid or expired OTP for ${key}`
      );

      await userSessionRepo.createSession({
        eventType: SESSION_EVENTS.LOGIN_FAILED.type,
        description: SESSION_EVENTS.LOGIN_FAILED.desc,
        deviceType,
        deviceToken,
      });

      return buildResponse(
        401,
        "Invalid or expired OTP",
        null
      );
    }

    let user = await userRepo.findByMobileNumber(
      mobileNumber
    );

    await redis.del(key);
    logger.info(`OTP deleted from Redis for ${key}`);

    if (!user) {
      return buildResponse(200, "OTP verified", {
        isRegistered: false,
        accessToken: null,
        user: null,
      });
    }

    if (user.status === 2) {
      logger.warn(
        `Blocked user attempting login: ${user._id}`
      );

      return buildResponse(
        200,
        "Your account has been inactive. Please contact administrator.",
        null
      );
    }

    if (user.verificationStatus === "PENDING") {
      return buildResponse(
        200,
        "Your registration is under review",
        {
          status: "PENDING",
        }
      );
    }

    if (user.verificationStatus === "REJECTED") {
      return buildResponse(
        200,
        "Your registration has been rejected",
        {
          status: "REJECTED",
          rejectedReason: user.rejectedReason,
        }
      );
    }

    if (!user.isVerified) {
      logger.warn(
        `User verification is pending: ${user._id}`
      );

      return buildResponse(
        200,
        "Your account has been under review. Please contact administrator.",
        null
      );
    }

    const token = jwtUtil.generate({
      sub: String(user._id),
      mobileNumber: user.mobileNumber,
    });

    logger.info(
      `JWT token generated for user ${user._id}`
    );

    try {
      await userSessionRepo.createSession({
        userId: user._id,
        deviceType,
        deviceToken,
        sessionToken: token,
        loginAt: new Date(),
        isActive: true,
        eventType: SESSION_EVENTS.LOGIN_SUCCESS.type,
        description: SESSION_EVENTS.LOGIN_SUCCESS.desc,
      });
    } catch (err) {
      logger.info(
        `Error occurs on user session creation ${err}`
      );
    }

    try {
      if (deviceToken && deviceType && deviceId) {
        const userDeviceData = {
          userId: user._id,
          deviceType,
          deviceToken,
          deviceId,
          notificationEnable: true,
          status: 1,
        };

        logger.info(
          `Saving device token for user ${user._id}`
        );

        logger.info(
          `Device Payload => ${JSON.stringify({
            userId: user._id,
            deviceType,
            deviceId,
            notificationEnable: true,
            status: 1,
          })}`
        );

        logger.info(
          `FCM Token => ${
            deviceToken
              ? deviceToken.substring(0, 50) + "..."
              : "NULL"
          }`
        );

        const updatedDevice =
          await userDeviceRepo.upsertUserDevice(
            userDeviceData
          );

        logger.info(
          `User device updated successfully`
        );

        logger.info(
          `Device Record => ${JSON.stringify({
            id: updatedDevice._id,
            userId: updatedDevice.userId,
            deviceId: updatedDevice.deviceId,
            deviceType: updatedDevice.deviceType,
            notificationEnable:
              updatedDevice.notificationEnable,
          })}`
        );
      } else {
        logger.warn(`Device registration skipped`);

        logger.warn(
          `userId=${user._id}, deviceType=${
            deviceType || "NULL"
          }, deviceId=${
            deviceId || "NULL"
          }, tokenPresent=${!!deviceToken}`
        );
      }
    } catch (deviceErr) {
      logger.error(
        `Exception while updating device token for user ${user._id}: ${deviceErr.message}`,
        deviceErr
      );
    }

    const committeeAccess =
  await getCommitteeAccessByMobileUserId(user._id);
    return buildResponse(
  200,
  "OTP verified successfully",
  {
    isRegistered: true,
    accessToken: token,
    user: {
      ...userResponse.buildUserResponse(user),
      committeeAccess,
    },
  }
);
  } catch (err) {
    logger.error(
      `verifyOtp failed for ${key}: ${err.message}`,
      err
    );

    return buildResponse(
      500,
      "Internal server error",
      null
    );
  }
}

async function logout(token) {
  logger.info("Logout initiated", { token });

  try {
    // 🔹 Close active session using token
    const session = await userSessionRepo.closeSessionByToken(token);

    if (!session) {
      logger.warn("Logout attempted with invalid or expired session token", {
        token,
      });
      return buildResponse(401, "Invalid or expired session", null);
    }

    logger.info("Active session found for logout", {
      sessionId: session._id,
      userId: session.userId,
    });

    // 🔹 Update session audit info
    session.eventType = "LOGOUT";
    session.description = "User logout successfully";
    session.logoutAt = new Date();
    session.isActive = false;
    await session.save();

    logger.info("User session closed successfully", {
      sessionId: session._id,
      logoutAt: session.logoutAt,
    });

    // 🔹 Remove user device token
    try {
      logger.info("Attempting to delete user device tokens", {
        userId: session.userId,
      });

      await userDeviceRepo.deleteByUserId(session.userId);

      logger.info("User device tokens deleted successfully", {
        userId: session.userId,
      });
    } catch (deviceErr) {
      logger.error("Failed to delete device tokens during logout", {
        userId: session.userId,
        error: deviceErr.message,
      });
    }

    logger.info("Logout completed successfully", {
      userId: session.userId,
    });

    return buildResponse(200, "Logout successful", null);
  } catch (err) {
    logger.error("Logout failed due to server error", {
      token,
      error: err.message,
      stack: err.stack,
    });
    return buildResponse(500, "Logout failed", null);
  }
}

async function sendFamilyOtp(familyId) {

    const family = await Family.findOne({
        familyId
    });

    if (!family) {
        return buildResponse(
            404,
            "Family not found",
            null
        );
    }

    const head = await Person.findById(
        family.familyHeadId
    );

    if (!head) {
        return buildResponse(
            404,
            "Family head not found",
            null
        );
    }

    if (!head.mobile) {
        return buildResponse(
            400,
            "Family head mobile number is not available",
            null
        );
    }

    const otp =
        Math.floor(
            1000 + Math.random() * 9000
        ).toString();

    await redis.set(
        `family-otp:${familyId}`,
        otp,
        "EX",
        300
    );

    // SMS Service
    // sendSms(head.mobile, otp)

    return buildResponse(
        200,
        "OTP sent successfully",
        {
            mobile: "XXXXXX" + head.mobile.slice(-4),
            OTP: otp,
        }
    );
}

async function verifyFamilyOtp(
    familyId,
    otp
) {

    const storedOtp =
        await redis.get(
            `family-otp:${familyId}`
        );

    if (
        !storedOtp ||
        storedOtp !== otp
    ) {
        return buildResponse(
            401,
            "Invalid OTP",
            null
        );
    }

    await redis.del(
        `family-otp:${familyId}`
    );

    return buildResponse(
        200,
        "OTP verified successfully",
        {
            familyId,
            registrationAllowed: true
        }
    );
}


async function registerFamilyMember(
    payload, file
) {

    const family =
        await Family.findOne({
            familyId:
                payload.familyId
        });

    if (!family) {
        return buildResponse(
            404,
            "Family not found",
            null
        );
    }

    const existing =
        await User.findOne({
            mobileNumber:
                payload.mobileNumber
        });

    if (existing) {
        return buildResponse(
            409,
            "User already registered",
            null
        );
    }


    let profileUrl;

    if (file) {
      try {
          const uploaded =
            await uploadToCloudinary(
              file.path,
              "kalota/profiles"
            );

          profileUrl =
            uploaded?.url || null;
        logger.info(`📸 Uploaded media file: ${profileUrl}`);
      } catch (err) {
        logger.error("❌ Failed to upload media file", {
          error: err.message,
        });
      }
    }
const user = await User.create({
  mobileNumber: payload.mobileNumber,

  firstName: payload.firstName,
  lastName: payload.lastName,

  fatherFirstName: payload.fatherFirstName,
  motherFirstName: payload.motherFirstName,

  gender: payload.gender,
  dob: payload.dob,

  relationType: payload.relationType,

  familyId: payload.familyId,
  familyHeadId: family.familyHeadId,

  districtId: family.districtId,
  tehsilId: family.tehsilId,
  villageId: family.villageId,

  name: `${payload.firstName} ${payload.lastName}`,

  profileUrl,

  profileCompleted: true,

  isVerified: false,

  verificationStatus: "PENDING",
});
    return buildResponse(
        200,
        "Registration submitted successfully. Waiting for admin approval.",
        user
    );
}

async function verifyUserRegistration(
  userId,
  action,
  rejectedReason
) {
  const user = await User.findById(userId);

  if (!user) {
    return buildResponse(
      404,
      "User not found",
      null
    );
  }

  if (
    user.verificationStatus ===
    "APPROVED"
  ) {
    return buildResponse(
      400,
      "User already approved",
      null
    );
  }

  if (action === "APPROVED") {
    user.verificationStatus =
      "APPROVED";

    user.isVerified = true;

    user.rejectedReason = null;

    await user.save();

    return buildResponse(
      200,
      "User approved successfully",
      user
    );
  }

  if (action === "REJECTED") {
    user.verificationStatus =
      "REJECTED";

    user.isVerified = false;

    user.rejectedReason =
      rejectedReason || "Rejected by administrator";

    await user.save();

    return buildResponse(
      200,
      "User rejected successfully",
      user
    );
  }

  return buildResponse(
    400,
    "Invalid action",
    null
  );
}
// 🟢 Create or get user by mobile
async function createOrGetByMobile( mobileNumber) {
  logger.info(`createOrGetByMobile: ${mobileNumber}`);
  let user = await userRepo.findByMobileNumber( mobileNumber);
  if (!user) {
    logger.info("User not found");
    return null;
  }
  return user;
}

// ✅ Block/Unblock/Delete User
async function blockUnblockUser(id, status, remark) {
  try {
    logger.info(`📝 blockUnblockUser called for ID: ${id} with status: ${status}`);

    const user = await User.findById(id);
    if (!user) {
      logger.warn(`⚠️ User not found with ID: ${id}`);
      return buildResponse(404, "Record not found.");
    }

    // Check current status
    if (user.status === status) {
      if (status === 1) {
        logger.info(`ℹ️ User ${id} already active`);
        return buildResponse(400, "User already active.");
      }
      if (status === 2) {
        logger.info(`ℹ️ User ${id} already inactive`);
        return buildResponse(400, "User already inactive");
      }
    }

    // Update status
    const oldStatus = user.status;
    user.status = status;
    if(status!=3){
      await user.save();
    }
    
    logger.info(`✅ User ${id} status changed from ${oldStatus} to ${status}`);

    let message = "Invalid Request.";
    if (status === 0) message = "User deleted successfully.";
    if (status === 1) {
      message = "User activated successfully.";
      try{
        //sendNotification(id,"USER_UNBLOCKED","Congrats!! Your accout is active now","The administrator has activate your account, you can login and explore the app.");
      }catch(err){
        log.info("Exception occurs while sending warn notification event");
      }
    }
    if (status === 2){ 
      message = "User deactivated successfully.";
      try{
        //sendNotification(id,"USER_BLOCKED","Account blocked by admin","The administrator has deactivated your account, Please contact to admin for query.");
      }catch(err){
        log.info("Exception occurs while sending warn notification event");
      }
    }
    if (status === 3) {
      
      message = "User Warn successfully."
      try{
        //sendNotification(id,"CONTENT_WARN","Content Policy Violation Notice",remark);
      }catch(err){
        log.info("Exception occurs while sending warn notification event");
      }
    };

    logger.info(`ℹ️ Response message for user ${id}: ${message}`);
    return buildResponse(200, message, userResponse.buildUserResponse(user));
  } catch (err) {
    logger.error(`❌ Error in blockUnblockUser for ID ${id}: ${err.stack || err.message}`);
    return buildResponse(500, "Internal Server Error!!", null);
  }
}


// 🟢 Get profile
async function getProfile(id, viewerId = null) {

  logger.info(`getProfile: id=${id}, viewerId=${viewerId}`);

  try {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return buildResponse(
        400,
        "Valid user id is required",
        null
      );
    }

    const user =
      await User.findById(id)
        .populate(
          "districtId",
          "name latitude longitude"
        )
        .populate(
          "tehsilId",
          "name latitude longitude"
        )
        .populate(
          "villageId",
          "name latitude longitude"
        );

    if (!user) {

      return buildResponse(
        404,
        "Record not found",
        null
      );
    }

    const viewer = viewerId || id;

    const [visibility, counts] =
      await Promise.all([
        visibilityService.canViewProfile(
          viewer,
          id
        ),
        visibilityService.getFollowCounts(id),
      ]);

    if (!visibility.canView) {
      return buildResponse(
        200,
        "Profile is private",
        {
          id: user._id,
          name: user.name || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          profileUrl: user.profileUrl || "",
          districtName:
            user.districtId?.name || "",
          districtResponse:
            user.districtId?._id
              ? {
                  id: user.districtId._id,
                  name: user.districtId.name || "",
                  latitude:
                    user.districtId.latitude ?? null,
                  longitude:
                    user.districtId.longitude ?? null,
                }
              : null,
          tehsilName:
            user.tehsilId?.name || "",
          tehsilResponse:
            user.tehsilId?._id
              ? {
                  id: user.tehsilId._id,
                  name: user.tehsilId.name || "",
                  latitude:
                    user.tehsilId.latitude ?? null,
                  longitude:
                    user.tehsilId.longitude ?? null,
                }
              : null,
          villageName:
            user.villageId?.name || "",
          villageResponse:
            user.villageId?._id
              ? {
                  id: user.villageId._id,
                  name: user.villageId.name || "",
                  latitude:
                    user.villageId.latitude ?? null,
                  longitude:
                    user.villageId.longitude ?? null,
                }
              : null,
          isPrivate: true,
          canViewFullProfile: false,
          followStatus:
            visibility.followStatus,
          privacyReason:
            visibility.reason,
          ...counts,
        }
      );
    }

    return buildResponse(
      200,
      "Record found successfully",
      {
        ...userResponse.buildUserResponse(
          user
        ),
        isPrivate: true,
        canViewFullProfile: true,
        followStatus:
          visibility.followStatus,
        ...counts,
      }
    );

  } catch (error) {

    logger.error(
      "Internal server error",
      { error }
    );

    return buildResponse(
      500,
      "Server Error",
      null
    );
  }
}

async function getProfileByIds(ids) {
  logger.info(`getProfileByIds: ids=${JSON.stringify(ids)}`);
  try {
    const users = await userRepo.findByIds(ids);

    if (users && users.length > 0) {
      return buildResponse(
        200,
        "Records found successfully",
        users.map((u) => userResponse.buildUserResponse(u))
      );
    } else {
      return buildResponse(404, "No records found", []);
    }
  } catch (error) {
    logger.error("Internal server error in getProfileByIds", {
      message: error.message,
      stack: error.stack,
    });
    return buildResponse(500, "Server Error", null);
  }
}



async function getAllUsers({
  pageIndex = 0,
  pageSize = 10,
  status,
  searchText = "",
  verificationStatus = "",
  villageId = "",
}) {
  try {
    const query = {};

    // Default status filter
    query.status = { $in: [1, 2] };

    // Status filter
    if (
      status !== undefined &&
      status !== null &&
      status !== ""
    ) {
      if (
        typeof status === "string" &&
        status.includes(",")
      ) {
        const parsedStatus = status
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((s) => !isNaN(s));

        if (parsedStatus.length > 0) {
          query.status = { $in: parsedStatus };
        }
      } else {
        const singleStatus = parseInt(status, 10);

        if (!isNaN(singleStatus)) {
          query.status = singleStatus;
        }
      }
    }

    // Verification status filter
    if (
      verificationStatus &&
      verificationStatus.trim() !== ""
    ) {
      if (verificationStatus.includes(",")) {
        query.verificationStatus = {
          $in: verificationStatus
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean),
        };
      } else {
        query.verificationStatus =
          verificationStatus.trim().toUpperCase();
      }
    }

    // Village filter
    if (villageId && villageId.trim() !== "") {
      query.villageId = new mongoose.Types.ObjectId(
        villageId.trim()
      );
    }

    // Search filter
    if (searchText && searchText.trim() !== "") {
      const searchRegex = {
        $regex: searchText.trim(),
        $options: "i",
      };

      query.$or = [
        { name: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { mobileNumber: searchRegex },
        { familyId: searchRegex },
      ];
    }

    const page = Number(pageIndex);
    const limit = Number(pageSize);
    const skip = page * limit;

    const users =
      await userRepo.findAllUsers(
        query,
        skip,
        limit
      );

    const total =
      await userRepo.countDocuments(query);

    const totalPages =
      Math.ceil(total / limit);

    const totalActive =
      await User.countDocuments({
        status: 1,
        profileCompleted: true,
      });

    const totalInActive =
      await User.countDocuments({
        status: 2,
        profileCompleted: true,
      });

    const totalPending =
      await User.countDocuments({
        verificationStatus: "PENDING",
      });

    const totalApproved =
      await User.countDocuments({
        verificationStatus: "APPROVED",
      });

    const totalRejected =
      await User.countDocuments({
        verificationStatus: "REJECTED",
      });

    if (!users || users.length === 0) {
      return buildResponse(
        404,
        "Records not found",
        null
      );
    }

    return buildResponse(
      200,
      "Records fetched successfully",
      {
        content: users.map(
          userResponse.buildUserResponse
        ),
        pageIndex: page,
        pageSize: limit,
        total,
        totalPages,
        isLast: page + 1 >= totalPages,
        hasNext: page + 1 < totalPages,
        hasPrevious: page > 0,

        totalActive,
        totalInActive,
        totalPending,
        totalApproved,
        totalRejected,
      }
    );
  } catch (error) {
    logger.error(
  "getAllUsers service error",
  {
    message: error.message,
    stack: error.stack,
    status,
    verificationStatus,
    villageId,
    searchText,
  }
);

    return buildResponse(
      500,
      "Internal server error",
      null
    );
  }
}


/**
 * Get all user sessions with pagination & filters
 */
async function getAllUserSessions({
  pageIndex = 0,
  pageSize = 10,
  searchText = "",
}) {
  try {
    let sessionQuery = {};

    const skip = pageIndex * pageSize;

    // 🔹 Aggregate to merge User + Session
    const sessions = await UserSession.aggregate([
      { $match: sessionQuery },

      // Join user data
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // 🔹 Optional search
      ...(searchText
        ? [
            {
              $match: {
                $or: [
                  { "user.name": { $regex: searchText, $options: "i" } },
                  { "user.email": { $regex: searchText, $options: "i" } },
                  {
                    "user.mobileNumber": {
                      $regex: searchText,
                      $options: "i",
                    },
                  },
                ],
              },
            },
          ]
        : []),

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },

      // 🔹 Shape response
      {
        $project: {
          _id: 0,
          sessionId: "$_id",
          eventType: 1,
          description: 1,
          isActive: 1,
          loginAt: {
            $dateToString: {
              format: "%d-%m-%Y %H:%M:%S",
              date: "$loginAt",
            },
          },
          logoutAt: {
            $cond: [
              { $ifNull: ["$logoutAt", false] },
              {
                $dateToString: {
                  format: "%d-%m-%Y %H:%M:%S",
                  date: "$logoutAt",
                },
              },
              null,
            ],
          },
          deviceType: 1,
          ipAddress: 1,

          user: {
            id: "$user._id",
            name: "$user.name",
            email: "$user.email",
            mobileNumber: "$user.mobileNumber",
            countryCode: "$user.countryCode",
            profileUrl: "$user.profileUrl",
            status: "$user.status",
          },
        },
      },
    ]);

    // 🔹 Count total
    const total = await UserSession.countDocuments(sessionQuery);

    // 🔹 Stats
    const totalLoginSuccess = await UserSession.countDocuments({
      eventType: "LOGIN_SUCCESS",
    });

    const totalLoginFailed = await UserSession.countDocuments({
      eventType: "LOGIN_FAILED",
    });

    const totalActiveSessions = await UserSession.countDocuments({
      isActive: true,
    });

    if (!sessions || sessions.length === 0) {
      return buildResponse(404, "Records not found", null);
    }

    return buildResponse(200, "Records fetched successfully", {
      content: sessions,
      pageIndex,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      isLast: pageIndex + 1 >= Math.ceil(total / pageSize),
      hasNext: pageIndex + 1 < Math.ceil(total / pageSize),
      hasPrevious: pageIndex > 0,

      // 🔹 Session stats
      totalLoginSuccess,
      totalLoginFailed,
      totalActiveSessions,
    });
  } catch (error) {
    logger.error("getAllUserSessions service error", { error });
    return buildResponse(500, "Internal server error", null);
  }
}




module.exports = {
  updateProfile,
  createOrGetByMobile,
  getProfile,
  getAllUsers,
  requestOtp,
  verifyOtp,
  blockUnblockUser,
  getProfileByIds,
  logout,
  getAllUserSessions,
  sendFamilyOtp,
  verifyFamilyOtp,
  registerFamilyMember,
  verifyUserRegistration,
  updateProfileImageService
};
