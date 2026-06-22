// routes/UserRoute.js

const express = require("express");
const router = express.Router();

const userController = require("../controllers/UserController");

const multer = require("multer");

const storage =
  multer.diskStorage({
    destination:
      "./uploads",

    filename: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        Date.now() +
          "-" +
          file.originalname
      );
    },
  });
const upload = multer({ storage });

/**
 * @openapi
 * tags:
 *   - name: User Controller
 *     description: User authentication, profile and family registration APIs
 */

/**
 * @openapi
 * /admin/mobile/user/requestOtp:
 *   post:
 *     tags: [User Controller]
 *     summary: Request login OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
  "/requestOtp",
  userController.requestOtp
);

/**
 * @openapi
 * /admin/mobile/user/verifyOtp:
 *   post:
 *     tags: [User Controller]
 *     summary: Verify login OTP
 *     description: Verify OTP and login user. Also stores device information for push notifications.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - otp
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "1234"
 *               deviceType:
 *                 type: string
 *                 enum:
 *                   - ANDROID
 *                   - IOS
 *                 example: "ANDROID"
 *               deviceToken:
 *                 type: string
 *                 example: "fcm_device_token_here"
 *               deviceId:
 *                 type: string
 *                 example: "android_device_123"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post(
  "/verifyOtp",
  userController.verifyOtp
);

/**
 * @openapi
 * /admin/mobile/user/updateProfile:
 *   post:
 *     tags: [User Controller]
 *     summary: Update user profile
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               descriptions:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.post(
  "/updateProfile",
  upload.single("profileImage"),
  userController.updateProfile
);

/**
 * @swagger
 * /admin/mobile/user/updateProfileImage:
 *   post:
 *     summary: Update user profile image
 *     tags: [User Controller]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - profileImage
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd1
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 */
router.post(
  "/updateProfileImage",
  upload.single("profileImage"),
  userController.updateProfileImage
);

/**
 * @openapi
 * /admin/mobile/user/getProfile:
 *   get:
 *     tags: [User Controller]
 *     summary: Get user profile
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 */
router.get(
  "/getProfile",
  userController.getProfile
);

/**
 * @openapi
 * /admin/mobile/user/logout:
 *   get:
 *     tags: [User Controller]
 *     summary: Logout user
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.get(
  "/logout",
  userController.logout
);

/**
 * @openapi
 * /admin/mobile/user/bulkGetProfiles:
 *   post:
 *     tags: [User Controller]
 *     summary: Get multiple user profiles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profiles fetched successfully
 */
router.post(
  "/bulkGetProfiles",
  userController.bulkGetProfiles
);

/**
 * @openapi
 * /admin/mobile/user/getAllUsers:
 *   get:
 *     tags: [User Controller]
 *     summary: Get all users
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: villageId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */
router.get(
  "/getAllUsers",
  userController.getAllUsers
);

/**
 * @openapi
 * /admin/mobile/user/getAllUserSessions:
 *   get:
 *     tags: [User Controller]
 *     summary: Get all user sessions
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sessions fetched successfully
 */
router.get(
  "/getAllUserSessions",
  userController.getAllUserSessions
);

/**
 * @openapi
 * /admin/mobile/user/blockUnblockUser:
 *   post:
 *     tags: [User Controller]
 *     summary: Block or unblock user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: string
 *               status:
 *                 type: integer
 *                 example: 1
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.post(
  "/blockUnblockUser",
  userController.blockUnblockUser
);

/**
 * =====================================================
 * FAMILY REGISTRATION FLOW
 * =====================================================
 */

/**
 * @openapi
 * /admin/mobile/user/sendFamilyOtp:
 *   post:
 *     tags: [User Controller]
 *     summary: Send OTP to family head mobile number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - familyId
 *             properties:
 *               familyId:
 *                 type: string
 *                 example: FAM000001
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
  "/sendFamilyOtp",
  userController.sendFamilyOtp
);

/**
 * @openapi
 * /admin/mobile/user/verifyFamilyOtp:
 *   post:
 *     tags: [User Controller]
 *     summary: Verify family OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - familyId
 *               - otp
 *             properties:
 *               familyId:
 *                 type: string
 *               otp:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post(
  "/verifyFamilyOtp",
  userController.verifyFamilyOtp
);

/**
 * @openapi
 * /admin/mobile/user/registerFamilyMember:
 *   post:
 *     tags:
 *       - User Controller
 *     summary: Register family member
 *     description: Register a new family member and submit for admin approval.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - familyId
 *               - mobileNumber
 *               - firstName
 *               - lastName
 *               - relationType
 *             properties:
 *               familyId:
 *                 type: string
 *                 example: FAM100001
 *
 *               mobileNumber:
 *                 type: string
 *                 example: 9876543210
 *
 *               firstName:
 *                 type: string
 *                 example: Nitesh
 *
 *               lastName:
 *                 type: string
 *                 example: Patel
 *
 *               fatherFirstName:
 *                 type: string
 *                 example: Ramprasad
 *
 *               motherFirstName:
 *                 type: string
 *                 example: Sushila
 *
 *               gender:
 *                 type: string
 *                 enum:
 *                   - MALE
 *                   - FEMALE
 *                   - OTHER
 *
 *               dob:
 *                 type: string
 *                 example: 25-12-1995
 *
 *               relationType:
 *                 type: string
 *                 enum:
 *                   - HEAD
 *                   - SPOUSE
 *                   - SON
 *                   - DAUGHTER
 *                   - FATHER
 *                   - MOTHER
 *                   - BROTHER
 *                   - SISTER
 *                   - GRANDFATHER
 *                   - GRANDMOTHER
 *                   - GRANDSON
 *                   - GRANDDAUGHTER
 *                   - UNCLE
 *                   - AUNT
 *                   - OTHER
 *
 *               profileImage:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *       200:
 *         description: Registration submitted successfully
 *
 *       404:
 *         description: Family not found
 *
 *       409:
 *         description: User already registered
 *
 *       500:
 *         description: Internal server error
 */
router.post(
  "/registerFamilyMember",
  upload.single("profileImage"),
  userController.registerFamilyMember
);

/**
 * @openapi
 * /admin/mobile/user/verifyRegistration:
 *   put:
 *     tags:
 *       - User Controller
 *     summary: Approve or reject user registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - action
 *             properties:
 *               userId:
 *                 type: string
 *
 *               action:
 *                 type: string
 *                 enum:
 *                   - APPROVED
 *                   - REJECTED
 *
 *               rejectedReason:
 *                 type: string
 *
 *     responses:
 *       200:
 *         description: Registration status updated
 */
router.put(
  "/verifyRegistration",
  userController.verifyUserRegistration
);
module.exports = router;