const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/MemberController");
const jwtUtil = require("../utils/JwtUtil");

/**
 * @openapi
 * tags:
 *   name: Member Controller
 *   description: Public member registration, OTP login and family access APIs
 */

function memberAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ responseCode: 401, message: "Missing token", responseBody: null });

  try {
    const decoded = jwtUtil.verify(token);
    if (decoded.type !== "MEMBER") {
      return res.status(401).json({ responseCode: 401, message: "Invalid member token", responseBody: null });
    }
    req.member = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ responseCode: 401, message: "Invalid token", responseBody: null });
  }
}

/**
 * @openapi
 * /member/auth/requestOtp:
 *   post:
 *     tags: [Member Controller]
 *     summary: Request OTP for member login or registration
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/auth/requestOtp", ctrl.requestOtp);

/**
 * @openapi
 * /member/auth/verifyOtp:
 *   post:
 *     tags: [Member Controller]
 *     summary: Verify OTP and login if member is approved
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "1234"
 *               deviceType:
 *                 type: string
 *                 example: "android"
 *               deviceToken:
 *                 type: string
 *                 example: "device-token"
 */
router.post("/auth/verifyOtp", ctrl.verifyOtp);

/**
 * @openapi
 * /member/register:
 *   post:
 *     tags: [Member Controller]
 *     summary: Register member after mobile OTP verification
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               familyId:
 *                 type: string
 *                 example: "KFP-DEW-TON-PIP-0001"
 *               name:
 *                 type: string
 *                 example: "Nitesh Patel"
 *               fatherName:
 *                 type: string
 *                 example: "Dilip Singh Patel"
 *               grandFatherName:
 *                 type: string
 *                 example: "Ramchandra Patel"
 *               sasurName:
 *                 type: string
 *                 example: ""
 *               grandSasurName:
 *                 type: string
 *                 example: ""
 *               email:
 *                 type: string
 *                 example: "nitesh@gmail.com"
 *               gender:
 *                 type: string
 *                 example: "MALE"
 *               isMarried:
 *                 type: boolean
 *                 example: false
 *               district:
 *                 type: string
 *                 example: "Dewas"
 *               tehsil:
 *                 type: string
 *                 example: "Tonkkhurd"
 *               village:
 *                 type: string
 *                 example: "Piplayasadak"
 *               isFamilyHead:
 *                 type: boolean
 *                 example: false
 */
router.post("/register", ctrl.registerMember);

/**
 * @openapi
 * /member/me:
 *   get:
 *     tags: [Member Controller]
 *     summary: Get logged in member profile
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", memberAuth, ctrl.getMyProfile);

/**
 * @openapi
 * /member/family/details:
 *   get:
 *     tags: [Member Controller]
 *     summary: Get logged in member family details
 *     security:
 *       - bearerAuth: []
 */
router.get("/family/details", memberAuth, ctrl.getMyFamilyDetails);

/**
 * @openapi
 * /member/logout:
 *   get:
 *     tags: [Member Controller]
 *     summary: Logout logged in member
 *     security:
 *       - bearerAuth: []
 */
router.get("/logout", memberAuth, ctrl.logout);

module.exports = router;
