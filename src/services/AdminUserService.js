const adminUserRepo = require("../repositories/AdminUserRepository");
const redis = require("../config/RedisConfig");
const jwtUtil = require("../utils/JwtUtil");
const logger = require("../utils/logger");
//const fileUtil = require("../utils/FileUtil");
const buildResponse = require("../utils/response");
const { buildUserResponse, buildUserRoleResponse } = require("../utils/ResponseBuilder");
const AdminUser = require("../models/AdminUser");
const SESSION_EVENTS = require("../constants/SessionEvents");
const UserSession = require("../models/UserSession");
const userSessionRepo = require("../repositories/UserSessionRepository");
const bcrypt = require("bcryptjs");
const mailUtil = require("../utils/mailUtil");
const crypto = require("crypto");
const mongoose = require("mongoose");
const redisClient = require("../config/RedisConfig");
const User = require("../models/User");
const uploadToCloudinary =
  require(
    "../utils/CloudnaryUploadUtil"
  );
const DataConstant = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  NO_CONTENT: 204,
  SERVER_ERROR: 500,

  SHORT_ZERO: 0,
  SHORT_ONE: 1,
  SHORT_TWO: 2,

  ROLE_CREATED: "Role created successfully",
  ROLE_UPDATED: "Role updated successfully",
  ROLE_DELETED: "Role deleted successfully",
  ROLE_ACTIVE: "Role activated successfully",
  ROLE_INACTIVE: "Role inactivated successfully",
  ROLE_NOT_FOUND: "Role not found",
  ROLE_MODULE_NOT_FOUND: "RoleModule not found",
  MODULE_NOT_FOUND: "Module not found",
  ROLE_BAD_REQUEST: "Invalid Role request",
  RECORD_FOUND: "Record found",
  RECORD_NOT_FOUND: "No records found",
  PAGINATION_REQUIRED: "Pagination params are required",
  SERVER_MESSAGE: "Internal Server Error",
  ROLE_ALREADY_ACTIVE: "Role is already active",
  ROLE_ALREADY_INACTIVE: "Role is already inactive",
  INVALID_REQUEST: "Invalid request"
};

async function linkMobileUser(data) {
  try {
    logger.info("linkMobileUser service started", {
      request: data,
    });

    const { adminUserId, mobileUserId } = data;

    if (!adminUserId) {
      return buildResponse(400, "Admin user is required", null);
    }

    if (!mobileUserId) {
      return buildResponse(400, "Mobile user is required", null);
    }

    const adminUser = await AdminUser.findById(adminUserId);

    if (!adminUser) {
      return buildResponse(404, "Admin user not found", null);
    }

    const mobileUser = await User.findById(mobileUserId);

    if (!mobileUser) {
      return buildResponse(404, "Mobile user not found", null);
    }

    const alreadyLinked = await AdminUser.findOne({
      mobileUserId,
      _id: { $ne: adminUserId },
    });

    if (alreadyLinked) {
      return buildResponse(
        400,
        "This mobile user is already linked with another admin user",
        null
      );
    }

    adminUser.mobileUserId = mobileUserId;
    adminUser.updatedAt = new Date();

    await adminUser.save();

    return buildResponse(200, "Mobile user linked successfully", {
      adminUser: buildUserResponse(adminUser),
      mobileUser: {
        id: mobileUser._id,
        name: mobileUser.name,
        mobileNumber: mobileUser.mobileNumber,
        familyId: mobileUser.familyId,
        profileUrl: mobileUser.profileUrl,
      },
    });
  } catch (err) {
    logger.error("linkMobileUser service error", {
      error: err.message,
      stack: err.stack,
      request: data,
    });

    return buildResponse(500, err.message, null);
  }
}

async function addAdmin(data) {
  try {
    if (!data) {
      logger.error("addAdmin: No data provided");
      return buildResponse(400, "Invalid request: no data provided", null);
    }

    logger.info(`addAdmin: userId=${data.id || "NEW_USER"}`);

    let imageUrl = null;

    if (data.imageFile) {
      try {
        const uploaded =
            await uploadToCloudinary(
              data.imageFile.path,
              "kalota/admin_user"
            );

          imageUrl = uploaded.url;
        logger.info(`📸 Uploaded profile image: ${imageUrl}`);
      } catch (err) {
        logger.error("❌ Failed to upload profile image", {
          error: err,
        });
      }
    }

    let encryptedPassword = null;

    // Encrypt password only if provided
    if (data.password && data.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      encryptedPassword = await bcrypt.hash(data.password, salt);
    }

    const safeUpdates = {
      ...data,
      profileUrl: imageUrl || data.image,
      updatedAt: new Date(),
    };

    // Store encrypted password
    if (encryptedPassword) {
      safeUpdates.password = encryptedPassword;
    }

    let user;

    // CREATE USER
    if (!data.id || data.id.trim() === "") {

      // Check duplicate email
      const existingUser = await adminUserRepo.findByEmail(data.email);

      if (existingUser) {
        return buildResponse(409, "Email already exists", null);
      }

      user = await adminUserRepo.createUser(safeUpdates);

      logger.info(`Created new user with id=${user._id}`);

      return buildResponse(
        201,
        "User created successfully",
        buildUserResponse(user)
      );
    }

    // UPDATE USER
    user = await adminUserRepo.updateUser(data.id, safeUpdates);

    if (!user) {
      logger.warn(`addAdmin: User not found id=${data.id}`);

      return buildResponse(404, "User not found", null);
    }

    return buildResponse(
      200,
      "User profile updated successfully",
      buildUserResponse(user)
    );

  } catch (err) {
    logger.error(`addAdmin error: ${err.message}`, {
      stack: err.stack,
    });

    return buildResponse(500, err.message, null);
  }
}


async function loginAdmin(data) {
  try {

    if (!data.email || !data.password) {
      return buildResponse(
        400,
        "Email and password are required",
        null
      );
    }

    // Find user by email
    const user = await adminUserRepo.findByEmail(data.email);

    if (!user) {
      return buildResponse(
        404,
        "Invalid email or password",
        null
      );
    }

    if (user.status === 2) {
      return buildResponse(
        403,
        "Your account is inactive. Please contact admin.",
        null
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      return buildResponse(
        401,
        "Invalid email or password",
        null
      );
    }

    const userWithRole = await buildUserRoleResponse(user);
        
    const token = jwtUtil.generate({
      email: user.email,
    });
    // 5️⃣ Return success response
    return buildResponse(200, "Login successfully", {
      accessToken:token,
      userResponse: userWithRole
    });

    

  } catch (err) {

    logger.error(`loginAdmin error: ${err.message}`, {
      stack: err.stack,
    });

    return buildResponse(
      500,
      err.message,
      null
    );
  }
}

// 🟢 Get user by mobile
async function findByCountryCodeAndMobileNumber(countryCode, mobileNumber) {
  logger.info(`findByCountryCodeAndMobileNumber: ${countryCode}${mobileNumber}`);
  try {
    const user = await adminUserRepo.findByCountryCodeAndMobileNumber(
      countryCode,
      mobileNumber
    );

    if (!user) {
      logger.warn(`⚠️ No user found for ${countryCode}${mobileNumber}`);
      return buildResponse(404, "User not found, Please contact admin.", null);
    }

    logger.info(`✅ User exists`);
    return buildResponse(200, "Record Found Successfully.", user);
  } catch (error) {
    logger.error(
      `❌ Error in findByCountryCodeAndMobileNumber for ${countryCode}${mobileNumber}: ${error.message}`,
      { stack: error.stack }
    );
    return buildResponse(500, "Internal Server Error.", null);
  }
}



// 🟢 Get profile
async function getProfile(id) {
  logger.info(`getProfile: id=${id}`);
  try {
    const user = await adminUserRepo.findById(id);
    if (user) {
      const userWithRole = await buildUserRoleResponse(user); // 🔥 await here
      return buildResponse(200, "Record found successfully", userWithRole);
    } else {
      return buildResponse(404, "Record not found", null);
    }
  } catch (error) {
    logger.error("Internal server error", { error });
    return buildResponse(500, "Server Error", null);
  }
}


async function getAllUsers({ pageIndex, pageSize, status, searchText }) {
  logger.info("getAllUsers called", { pageIndex, pageSize, status, searchText });

  try {

    let query = {
    status: { $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO] },
    };

    // Convert status to integer if it’s a string
    if (status !== undefined && status !== null && status !== "") {
      console.log("🟡 Received status:", status);

      const parsedStatus = parseInt(status, 10);

      if (!isNaN(parsedStatus)) {
        console.log("✅ Parsed status as integer:", parsedStatus);
        query.status = parsedStatus;
      } else {
        console.warn("⚠️ Invalid status value, not a number:", status);
      }
    } else {
      console.info("ℹ️ No status provided, using default query:", query.status);
    }


    if (searchText && searchText.trim() !== "") {
      logger.info(`Searching users with text="${searchText}"`);
      query.$or = [
        { name: { $regex: searchText.trim(), $options: "i" } }
      ];
    } else {
      logger.info("Fetching all users without search filter");
    }

    const skip = pageIndex * pageSize;
    logger.info(`Pagination applied: skip=${skip}, limit=${pageSize}`);

    const users = await adminUserRepo.findAllUsers(query, skip, pageSize);
    const totalRecords = await adminUserRepo.countDocuments(query);

    let query2 = { status: 1 };
    const totalActive = await adminUserRepo.countDocuments(query2);

    query2 = { status: 2 };
    const totalInActive = await adminUserRepo.countDocuments(query2);

    if (users && users.length > 0) {
      logger.info(`✅ Found ${users.length} users`);

      return buildResponse(200, "Records fetched successfully", {
        content: users.map(buildUserResponse),
        pageIndex,
        pageSize,
        totalRecords,
        totalActive,
        totalInActive,
        totalPages: Math.ceil(totalRecords / pageSize),
        isLast: pageIndex + 1 >= Math.ceil(totalRecords / pageSize),
        hasNext: pageIndex + 1 < Math.ceil(totalRecords / pageSize),
        hasPrevious: pageIndex > 0,
        
      });
    } else {
      logger.warn("⚠️ No users found");
      return buildResponse(404, "Records not found", null);
    }
  } catch (error) {
    logger.error("❌ getAllUsers service error", { error });
    return buildResponse(500, "Internal server error", null);
  }
}



// 🟢 Request OTP
async function requestOtp(countryCode, mobileNumber) {
  logger.info(`requestOtp for ${countryCode}${mobileNumber}`);

      // 1️⃣ Check if user already exists
  const user = await AdminUser.findOne({ countryCode, mobileNumber });

  if (user) {
    // 2️⃣ If user inactive (status = 2)
    if (user.status === 2) {
      return buildResponse(
        403,
        "Your account is inactive. Please contact administrator.",
        null
      );
    }
  }
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  await redis.set(`otp:${countryCode}${mobileNumber}`, otp, "EX", 60 * 5);

  if (process.env.NODE_ENV !== "production") {
    logger.info(`[DEV OTP] ${countryCode}${mobileNumber} -> ${otp}`);
  }

  return buildResponse(200, "OTP sent successfully", otp);
}

// 🟢 Verify OTP
async function verifyOtp(countryCode, mobileNumber, otp, deviceType, deviceToken) {
  const key = `otp:${countryCode}${mobileNumber}`;
  logger.info(`verifyOtp for ${key}`);

  try {
    // 1️⃣ Check OTP in Redis
    const stored = await redis.get(key);
    if (!stored || stored !== otp) {
      logger.warn(`verifyOtp: invalid or expired OTP for ${key}`);
      await userSessionRepo.createSession({
        eventType: SESSION_EVENTS.LOGIN_FAILED.type,
        description: SESSION_EVENTS.LOGIN_FAILED.desc,
        deviceType,
        deviceToken,
      });
      return buildResponse(401, "Invalid or expired OTP", null);
    }

    // 2️⃣ Check if user exists
    const userResponse = await findByCountryCodeAndMobileNumber(
      countryCode,
      mobileNumber
    );

    if (userResponse.responseCode !== 200) {
      return buildResponse(
        404,
        "Given mobile number doesn't exist",
        null
      );
    }

    const user = userResponse.responseBody;

    
    
    // 3️⃣ If OTP valid & user found → generate JWT token
    const token = jwtUtil.generate({
      countryCode: user.countryCode,
      mobileNumber: user.mobileNumber,
    });

    logger.info(`✅ OTP verified for ${key}`);


    
    try{
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

    }catch(err){
        logger.info(`Error occurs on user session creation ${err}`);
    }
    // 4️⃣ Delete OTP from Redis after successful verification
    await redis.del(key);

    const userWithRole = await buildUserRoleResponse(user);
    // 5️⃣ Return success response
    return buildResponse(200, "OTP verified successfully", {
      accessToken:token,
      userResponse: userWithRole
    });
    
  } catch (error) {
    logger.error(`❌ Error in verifyOtp for ${key}: ${error.message}`, {
      stack: error.stack,
    });
    return buildResponse(500, "Internal Server Error", null);
  }
}

// ✅ Block/Unblock/Delete User
async function blockUnblockUser(id, status) {
  try {
    logger.info(`📝 blockUnblockUser called for ID: ${id} with status: ${status}`);

    const adminUser = await AdminUser.findById(id);
    if (!adminUser) {
      logger.warn(`⚠️ User not found with ID: ${id}`);
      return buildResponse(404, "Record not found.");
    }

    // Check current status
    if (adminUser.status === status) {
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
    const oldStatus = adminUser.status;
    adminUser.status = status;
    await adminUser.save();
    logger.info(`✅ User ${id} status changed from ${oldStatus} to ${status}`);

    let message = "Invalid Request.";
    if (status === 0) message = "User deleted successfully.";
    if (status === 1) message = "User activated successfully.";
    if (status === 2) message = "User deactivated successfully.";

    logger.info(`ℹ️ Response message for user ${id}: ${message}`);
    return buildResponse(200, message, buildUserResponse(adminUser));
  } catch (err) {
    logger.error(`❌ Error in blockUnblockUser for ID ${id}: ${err.stack || err.message}`);
    return buildResponse(500, "Internal Server Error!!", null);
  }
}



// 🟢 Upload profile pic
async function uploadProfile(file) {
  try {
    if (!file) {
      logger.warn("uploadProfile: file missing");
      return buildResponse(400, "File required", null);
    }

    const base = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 4002}`;
    const url = `${base}/uploads/${file.filename}`;

    logger.info(`uploadProfile: file uploaded successfully filename=${file.filename}`);

    return buildResponse(201, "File uploaded successfully", {
      url,
      filename: file.filename,
    });
  } catch (err) {
    logger.error(`uploadProfile error: ${err.message}`);
    return buildResponse(500, "Internal server error", null);
  }
}

async function uploadMultipleFiles(files) {
  try {
    if (!files || files.length === 0) {
      logger.warn("uploadMultipleFiles: no files provided");
      return buildResponse(400, "At least one file required", null);
    }

    const base = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 4002}`;

    // Build URLs for each uploaded file
    const uploadedFiles = files.map((file) => ({
      url: `${base}/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    }));

    logger.info(`uploadMultipleFiles: ${files.length} files uploaded successfully`);

    return buildResponse(201, "Files uploaded successfully", uploadedFiles);
  } catch (err) {
    logger.error(`uploadMultipleFiles error: ${err.message}`);
    return buildResponse(500, "Internal server error", null);
  }
}

async function getTotalUserCount() {
  try {
    const totalUserCount = await AdminUser.countDocuments({
      status: { $ne: 0 },
    });

     return buildResponse(200, "Successfully fetched!!", totalUserCount);
    
  } catch (error) {
    logger.error("❌ Error fetching user count", {
      error: error.message
    });
    return buildResponse(500, "Internal Server Error!!", error.message);
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
          from: "admin_users",
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
      }

      ,
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

async function forgotPasswordOtp(data) {
  try {

    if (!data.email) {
      return buildResponse(
        400,
        "Email is required",
        null
      );
    }

    const email = data.email.toLowerCase();

    // Check User
    const user = await AdminUser.findOne({ email });

    if (!user) {
      return buildResponse(
        404,
        "User not found",
        null
      );
    }

    // Generate OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Redis Key
    const redisKey = `RESET_OTP:${email}`;

    /**
     * Store OTP in Redis
     * EX = expiry in seconds
     */
    await redisClient.set(
      redisKey,
      otp,
      "EX",
      600 // 10 mins
    );

    
    try{
      // Send Email
    await mailUtil.sendMail(
      email,
      "Reset Password OTP",
      `
      <h2>Password Reset OTP</h2>

      <p>Your OTP is:</p>

      <h1>${otp}</h1>

      <p>OTP valid for 10 minutes.</p>
      `
    );

    }catch(err){
      logger.error('Exception occurs while sending the mail');
    }

    

    return buildResponse(
      200,
      "OTP sent successfully",
      otp
    );

  } catch (err) {

    logger.error(
      `forgotPasswordOtp error: ${err.message}`
    );

    return buildResponse(
      500,
      err.message,
      null
    );
  }
}

async function resetPasswordWithOtp(data) {
  try {

    const {
      email,
      otp,
      newPassword
    } = data;

    if (!email || !otp || !newPassword) {
      return buildResponse(
        400,
        "Email, OTP and newPassword required",
        null
      );
    }

    const lowerEmail = email.toLowerCase();

    // Find User
    const user = await AdminUser.findOne({
      email: lowerEmail
    });

    if (!user) {
      return buildResponse(
        404,
        "User not found",
        null
      );
    }

    // Redis Key
    const redisKey = `RESET_OTP:${lowerEmail}`;

    // Get OTP from Redis
    const storedOtp =
      await redisClient.get(redisKey);

    if (!storedOtp) {
      return buildResponse(
        400,
        "OTP expired",
        null
      );
    }

    // Validate OTP
    if (storedOtp !== otp) {
      return buildResponse(
        400,
        "Invalid OTP",
        null
      );
    }

    // Encrypt Password
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(
      newPassword,
      salt
    );

    await user.save();

    // Delete OTP after success
    await redisClient.del(redisKey);

    return buildResponse(
      200,
      "Password reset successful",
      null
    );

  } catch (err) {

    logger.error(
      `resetPasswordWithOtp error: ${err.message}`
    );

    return buildResponse(
      500,
      err.message,
      null
    );
  }
}

async function forgotPasswordLink(data) {
  try {

    if (!data.email) {
      return buildResponse(
        400,
        "Email is required",
        null
      );
    }

    const user = await AdminUser.findOne({
      email: data.email.toLowerCase(),
    });

    if (!user) {
      return buildResponse(
        404,
        "User not found",
        null
      );
    }

    // Generate Token
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    user.resetToken = resetToken;

    // 30 mins expiry
    user.resetTokenExpiry = new Date(
      Date.now() + 30 * 60 * 1000
    );

    await user.save();

    const resetLink =
      `${process.env.FRONTEND_URL}` +
      `/reset-password?token=${resetToken}`;


      try{

            // Send Email
    await mailUtil.sendMail(
      user.email,
      "Reset Password Link",
      `
      <h2>Reset Password</h2>

      <p>Click below link to reset password:</p>

      <a href="${resetLink}">
        Reset Password
      </a>

      <p>Link valid for 30 minutes.</p>
      `
    );
      }catch(err){
        logger.error("Exception occurs while sending forgot password link mail.")
      }

    return buildResponse(
      200,
      "Reset password link sent successfully",
      resetLink
    );

  } catch (err) {

    logger.error("forgotPasswordLink error", err);

    return buildResponse(
      500,
      err.message,
      null
    );
  }
}

async function resetPasswordUsingLink(data) {
  try {

    const { token, newPassword } = data;

    if (!token || !newPassword) {
      return buildResponse(
        400,
        "Token and newPassword required",
        null
      );
    }

    const user = await AdminUser.findOne({
      resetToken: token,
    });

    if (!user) {
      return buildResponse(
        400,
        "Invalid reset token",
        null
      );
    }

    // Expiry Check
    if (new Date() > user.resetTokenExpiry) {
      return buildResponse(
        400,
        "Reset token expired",
        null
      );
    }

    // Encrypt Password
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(
      newPassword,
      salt
    );

    // Clear Token
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    return buildResponse(
      200,
      "Password reset successful",
      null
    );

  } catch (err) {

    logger.error(
      "resetPasswordUsingLink error",
      err
    );

    return buildResponse(
      500,
      err.message,
      null
    );
  }
}

async function changePassword(data) {
  try {
    const {
      id,
      existingPassword,
      newPassword,
    } = data;

    if (!id) {
      return buildResponse(
        400,
        "id is required",
        null
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return buildResponse(
        400,
        "Invalid id",
        null
      );
    }

    if (!existingPassword) {
      return buildResponse(
        400,
        "existingPassword is required",
        null
      );
    }

    if (!newPassword) {
      return buildResponse(
        400,
        "newPassword is required",
        null
      );
    }

    const trimmedExistingPassword =
      String(existingPassword).trim();
    const trimmedNewPassword =
      String(newPassword).trim();

    if (!trimmedExistingPassword) {
      return buildResponse(
        400,
        "existingPassword cannot be empty",
        null
      );
    }

    if (!trimmedNewPassword) {
      return buildResponse(
        400,
        "newPassword cannot be empty",
        null
      );
    }

    if (trimmedExistingPassword === trimmedNewPassword) {
      return buildResponse(
        400,
        "newPassword must be different from existingPassword",
        null
      );
    }

    if (trimmedNewPassword.length < 6) {
      return buildResponse(
        400,
        "newPassword must be at least 6 characters",
        null
      );
    }

    const user =
      await AdminUser.findById(
        id
      );

    if (!user) {
      return buildResponse(
        404,
        "Admin user not found",
        null
      );
    }

    if (user.status === 2) {
      return buildResponse(
        403,
        "Your account is inactive. Please contact admin.",
        null
      );
    }

    const isOldPasswordValid =
      await bcrypt.compare(
        trimmedExistingPassword,
        user.password
      );

    if (!isOldPasswordValid) {
      return buildResponse(
        401,
        "existingPassword is incorrect",
        null
      );
    }

    const salt =
      await bcrypt.genSalt(10);

    user.password =
      await bcrypt.hash(
        trimmedNewPassword,
        salt
      );
    user.updatedAt = new Date();

    await user.save();

    return buildResponse(
      200,
      "Password changed successfully",
      null
    );
  } catch (err) {
    logger.error("changePassword error", {
      error: err.message,
      stack: err.stack,
      request: {
        id: data?.id,
      },
    });

    return buildResponse(
      500,
      err.message,
      null
    );
  }
}

module.exports = {
  forgotPasswordOtp,
  resetPasswordWithOtp,
  forgotPasswordLink,
  resetPasswordUsingLink,
  changePassword,
  addAdmin,
  findByCountryCodeAndMobileNumber,
  getProfile,
  getAllUsers,
  requestOtp,
  verifyOtp,
  uploadProfile,
  uploadMultipleFiles,
  blockUnblockUser,
  getTotalUserCount,
  getAllUserSessions,
  loginAdmin,
  logout,
  linkMobileUser
};
