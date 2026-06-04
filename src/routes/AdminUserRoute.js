/**
 * @openapi
 * tags:
 *   - name: Admin User Controller
 *     description: User management and authentication APIs
 */
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/AdminUserController");
const jwtUtil = require("../utils/JwtUtil");
const multer = require("multer");
// Multer setup (memory storage so we can pass buffer to fileUtil)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Middleware for JWT authentication
 */
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwtUtil.verify(t);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * @openapi
 * /admin/user/addAdmin:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Add user profile
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "id"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "johndoe@example.com"
 *               password:
 *                 type: string
 *                 example: "Test@123"
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *               mobileNumber:
 *                 type: string
 *                 example: "1234567890"
 *               address:
 *                 type: string
 *                 example: "123 Street, Area"
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *               country:
 *                 type: string
 *                 example: "India"
 *               imageFile:
 *                 type: string
 *                 format: binary
 *               roleId:
 *                 type: string
 *                 example: "Assign role id"
 *     responses:
 *       200:
 *         description: Admin User Controller profile added successfully
 *       400:
 *         description: Bad request
 */
router.post("/addAdmin", upload.fields([
    { name: "imageFile", maxCount: 1 }
  ]), ctrl.addAdmin);

/**
 * @openapi
 * /admin/user/login:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@test.test"
 *               password:
 *                 type: string
 *                 example: "Test@123"
 *               deviceType:
 *                 type: string
 *                 example: "android/ios"
 *               deviceToken:
 *                 type: string
 *                 example: "ab12d"
 *     responses:
 *       200:
 *         description: Login success, user logged in
 *       401:
 *         description: Invalid Credentials
 */
router.post("/login", ctrl.login);

/**
 * @openapi
 * /admin/user/forgot-password-otp:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Send forgot password OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@test.test"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 */
router.post(
  "/forgot-password-otp",
  ctrl.forgotPasswordOtp
);


/**
 * @openapi
 * /admin/user/reset-password-otp:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Reset password using OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@test.test"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "Test@123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP / OTP expired
 */
router.post(
  "/reset-password-otp",
  ctrl.resetPasswordWithOtp
);


/**
 * @openapi
 * /admin/user/forgot-password-link:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Send password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@test.test"
 *     responses:
 *       200:
 *         description: Reset password link sent successfully
 *       404:
 *         description: User not found
 */
router.post(
  "/forgot-password-link",
  ctrl.forgotPasswordLink
);


/**
 * @openapi
 * /admin/user/reset-password-link:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Reset password using link token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "a12bc34d56ef"
 *               newPassword:
 *                 type: string
 *                 example: "Test@123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password-link",
  ctrl.resetPasswordUsingLink
);


/**
 * @openapi
 * /admin/user/requestOtp:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Request OTP for login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "1234567890"
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid request
 */
router.post("/requestOtp", ctrl.requestOtp);

/**
 * @openapi
 * /admin/user/verifyOtp:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Verify OTP and login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               countryCode:
 *                 type: string
 *                 example: "+91"
 *               mobileNumber:
 *                 type: string
 *                 example: "1234567890"
 *               otp:
 *                 type: string
 *                 example: "1234"
 *               deviceType:
 *                 type: string
 *                 example: "android/ios"
 *               deviceToken:
 *                 type: string
 *                 example: "ab12d"
 *     responses:
 *       200:
 *         description: OTP verified, user logged in
 *       401:
 *         description: Invalid OTP
 */
router.post("/verifyOtp", ctrl.verifyOtp);

/**
 * @openapi
 * /admin/user/blockUnblock:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Block or Unblock a User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               status:
 *                 type: integer
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated
 */
router.post("/blockUnblock", ctrl.blockUnblockUser);

/**
 * @openapi
 * /admin/user/getProfile/{id}:
 *   get:
 *     tags: [Admin User Controller]
 *     summary: Get user profile by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/getProfile/:id", ctrl.getProfile);

/**
 * @openapi
 * /admin/user/getAllUser:
 *   get:
 *     tags: [Admin User Controller]
 *     summary: Get list of all admin (with pagination & search, sorted by createdAt DESC)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page index (starting from 0)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: User status (active/inactive)
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Search text for filtering admin (name, email, etc.)
 *     responses:
 *       200:
 *         description: List of admin
 *       401:
 *         description: Unauthorized
 */
router.get("/getAllUser", ctrl.getAllUsers);

/**
 * @openapi
 * /admin/user/getTotalUserCount:
 *   get:
 *     tags: [Admin User Controller]
 *     summary:  User count by filter
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User count
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User Count not found
 */
router.get("/getTotalUserCount", ctrl.getTotalUserCount);


/**
 * @openapi
 * /admin/user/getAllUserLogs:
 *   get:
 *     tags: [Admin User Controller]
 *     summary: Get list of all users logs (with pagination, optional status & search)
 *     description: Fetch paginated users, optionally filtered by status or search text. Results are sorted by createdAt in descending order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page index (starting from 0)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *           example: "John"
 *         description: Optional search keyword (name, email, etc.)
 *     responses:
 *       200:
 *         description: List of users logs fetched successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/getAllUserLogs", ctrl.getAllUserSessions);


/**
 * @openapi
 * /admin/user/upload:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Upload user profile image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/upload", upload.single("file"), ctrl.uploadFile);


/**
 * @openapi
 * /admin/user/uploadMultipleFiles:
 *   post:
 *     tags: [Admin User Controller]
 *     summary: Upload multiple files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/uploadMultipleFiles", upload.array("files", 50), ctrl.uploadMultipleFiles);


/**
 * @openapi
 * /admin/user/logout:
 *   get:
 *     tags: [Admin User Controller]
 *     summary: Logout user by token
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: User access token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User Logout
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get("/logout", ctrl.logout);


module.exports = router;
