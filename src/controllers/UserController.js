const userService = require("../services/UserService");
const buildResponse = require("../utils/response");
const fileUtil = require("../utils/FileUtil");
const logger = require("../utils/logger");
const userResponse = require("../response/UserResponse");
const userRepo = require("../repositories/UserRepository");
const axios = require("axios");


// 🔹 Update Profile
exports.updateProfile = async (req, res) => {
  const { id, ...updates } = req.body;
  const file = req.file; // ✅ multer attaches uploaded file here

  logger.info(`📝 updateProfile called for userId=${id}`, {
    updates,
    hasFile: !!file,
    fileName: file ? file.originalname : null,
    fileSize: file ? file.size : null,
  });

  try {
    const result = await userService.updateProfile(id, updates, file);

    logger.info(`✅ Profile updated successfully for userId=${id}`, {
      responseCode: result.responseCode,
    });

    res.status(200).json(result);
  } catch (err) {
    logger.error(`❌ Failed to update profile for userId=${id}`, {
      error: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      responseCode: 500,
      responseMessage: "Internal server error",
    });
  }
};

exports.updateProfileImage = async(req, res)=> {
  const response =
    await userService.updateProfileImageService(
      req.body,
      req.file
    );

  return res
    .status(response.responseCode || 200)
    .json(response);
};


// 🔹 Request OTP
exports.requestOtp = async (req, res) => {
  const { mobileNumber } = req.body || {};
  if (!mobileNumber ) {
    return res.status(200).json(buildResponse(400, "mobileNumber required", null));
  }
  const result = await userService.requestOtp( mobileNumber);
  res.status(200).json(result);
};

// 🔹 Verify OTP
exports.verifyOtp = async (req, res) => {
  const {
    mobileNumber,
    otp,
    deviceType,
    deviceToken,
    deviceId,
    
  } = req.body || {};

  if (!mobileNumber || !otp) {
    return res
      .status(200)
      .json(
        buildResponse(
          400,
          "mobileNumber and otp required",
          null
        )
      );
  }

  const result = await userService.verifyOtp(
    mobileNumber,
    otp,
    deviceType,
    deviceToken,
    deviceId
    
  );

  return res
    .status( 200)
    .json(result);
};


exports.blockUnblockUser = async (req, res) => {
  try {
    const { id, status, remark } = req.body;
    const updatedUser = await userService.blockUnblockUser(id, status, remark);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Me
exports.getProfile = async (req, res) => {
  const { id } = req.query; // 👈 get id from query param
  console.log(`📥 Incoming request: getProfile with id=${id}`);

  try {
    const result = await userService.getProfile(id);
    console.log(`✅ getProfile success:`, result);

    res.status(200).json(result);
  } catch (error) {
    console.error(`❌ getProfile failed for id=${id}:`, error.message);

    res.status(500).json({
      responseCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  const { token } = req.query; // 👈 get id from query param
  console.log(`📥 Incoming request: logout with token=${token}`);

  try {
    const result = await userService.logout(token);
    console.log(`✅ Logout success:`, result);

    res.status(200).json(result);
  } catch (error) {
    console.error(`❌ Logout failed for id=${token}:`, error.message);

    res.status(500).json({
      responseCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.verifyUserRegistration = async (req, res) => {
    try {
      const {
        userId,
        action,
        rejectedReason,
      } = req.body;

      const response =
        await userService.verifyUserRegistration(
          userId,
          action,
          rejectedReason
        );

      return res
        .status(response.responseCode)
        .json(response);
    } catch (error) {
      logger.error(error);

      return res.status(500).json(
        buildResponse(
          500,
          "Internal server error",
          null
        )
      );
    }
  };



exports.bulkGetProfiles = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(200).json({ error: "ids must be a non-empty array" });
    }

    const profiles = await userService.getProfileByIds(ids);
    res.json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



exports.getAllUsers = async (req, res) => {
  try {
    // Safely extract from query or body depending on how you're sending them
    const {
      pageIndex = 0,
      pageSize = 10,
      status,
      searchText,
      verificationStatus,
      villageId
    } = req.query || req.body || {};

    // Parse numeric values safely
    const parsedPageIndex = Number.isInteger(parseInt(pageIndex)) ? parseInt(pageIndex, 10) : 0;
    const parsedPageSize = Number.isInteger(parseInt(pageSize)) ? parseInt(pageSize, 10) : 10;

    // Only trim searchText if it's a string
    const trimmedSearchText = typeof searchText === "string" ? searchText.trim() : "";

    // Pass parameters safely to service
    const result = await userService.getAllUsers({
      pageIndex: parsedPageIndex,
      pageSize: parsedPageSize,
      status,
      searchText: trimmedSearchText,
      verificationStatus,
      villageId
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("getAllUsers controller error", { error });
    return res.status(500).json(buildResponse(500, "Internal server error", null));
  }
};

exports.getAllUserSessions = async (req, res) => {
  try {
    // Safely extract from query or body depending on how you're sending them
    const {
      pageIndex = 0,
      pageSize = 10,
      searchText,
    } = req.query || req.body || {};

    // Parse numeric values safely
    const parsedPageIndex = Number.isInteger(parseInt(pageIndex)) ? parseInt(pageIndex, 10) : 0;
    const parsedPageSize = Number.isInteger(parseInt(pageSize)) ? parseInt(pageSize, 10) : 10;

    // Only trim searchText if it's a string
    const trimmedSearchText = typeof searchText === "string" ? searchText.trim() : "";

    // Pass parameters safely to service
    const result = await userService.getAllUserSessions({
      pageIndex: parsedPageIndex,
      pageSize: parsedPageSize,
      searchText: trimmedSearchText,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("getAllUserSessions controller error", { error });
    return res.status(200).json(buildResponse(500, "Internal server error", null));
  }
};


/**
 * Send OTP to Family Head Mobile
 */
exports.sendFamilyOtp = async (
  req,
  res
) => {
  try {
    const { familyId } = req.body;

    const response =
      await userService.sendFamilyOtp(
        familyId
      );

    res.json(response);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

/**
 * Verify Family OTP
 */
exports.verifyFamilyOtp = async (
  req,
  res
) => {
  try {
    const { familyId, otp } =
      req.body;

    const response =
      await userService.verifyFamilyOtp(
        familyId,
        otp
      );

    res.json(response);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

/**
 * Register Family Member
 */
exports.registerFamilyMember =
  async (req, res) => {
    try {
      const response =
        await userService.registerFamilyMember(
          req.body,
          req.file
        );

      res.json(response);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  };


