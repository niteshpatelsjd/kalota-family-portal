// routes/familyRoutes.js

const express = require("express");
const router = express.Router();

const familyController = require("../controllers/FamilyController");
const upload = require("../middlewares/uploadMiddleware");

/**
 * @openapi
 * tags:
 *   name: Family Controller
 *   description: Family management APIs
 */

/**
 * @openapi
 * /admin/family/createFamilyHead:
 *   post:
 *     tags: [Family Controller]
 *     summary: Create family head
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *
 *               middleName:
 *                 type: string
 *
 *               lastName:
 *                 type: string
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
 *                 example: "25-12-1995"
 *                 description: Date format should be dd-MM-yyyy
 *
 *               mobile:
 *                 type: string
 *
 *               email:
 *                 type: string
 *
 *               occupation:
 *                 type: string
 *                 enum:
 *                   - Farmer
 *                   - Professional
 *                   - Business
 *
 *               education:
 *                 type: string
 *                 enum:
 *                   - School
 *                   - Diploma
 *                   - Graduation
 *                   - Post Graduation
 *
 *               maritalStatus:
 *                 type: string
 *                 enum:
 *                   - SINGLE
 *                   - MARRIED
 *                   - DIVORCED
 *                   - WIDOW
 *                   - WIDOWER
 *
 *               villageId:
 *                 type: string
 *
 *               fatherFirstName:
 *                 type: string
 *
 *               fatherMiddleName:
 *                 type: string
 *
 *               fatherLastName:
 *                 type: string
 *
 *               motherFirstName:
 *                 type: string
 *
 *               motherLastName:
 *                 type: string
 *
 *               profileImage:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *       201:
 *         description: Family created successfully
 */
router.post(
  "/createFamilyHead",
  upload.single("profileImage"),
  familyController.createFamilyHead
);

/**
 * @openapi
 * /admin/family/checkDuplicateFamily:
 *   post:
 *     tags: [Family Controller]
 *     summary: Check duplicate family
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - villageId
 *             properties:
 *               firstName:
 *                 type: string
 *
 *               fatherFirstName:
 *                 type: string
 *
 *               motherFirstName:
 *                 type: string
 *
 *               lastName:
 *                 type: string
 *
 *               dob:
 *                 type: string
 *                 example: "25-12-1995"
 *                 description: Date format should be dd-MM-yyyy
 *
 *               villageId:
 *                 type: string
 *
 *     responses:
 *       200:
 *         description: Duplicate check result
 */
router.post(
  "/checkDuplicateFamily",
  familyController.checkDuplicateFamily
);



/**
 * @openapi
 * /admin/family/profile:
 *   get:
 *     tags: [Family Controller]
 *     summary: Get family profile by familyId
 *     parameters:
 *       - in: query
 *         name: familyId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Family profile details
 */
router.get(
  "/profile",
  familyController.getFamilyProfileById
);


/**
 * @openapi
 * /admin/family/getAllFamilies:
 *   get:
 *     tags: [Family Controller]
 *     summary: Get all families with pagination and filters
 *
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *         example: 0
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         example: 10
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *         description: 1 = Active, 2 = Inactive
 *
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Search by familyId or familyTitle
 *
 *       - in: query
 *         name: districtId
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: tehsilId
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: villageId
 *         schema:
 *           type: string
 *
 *     responses:
 *       200:
 *         description: Family list fetched successfully
 */
router.get(
  "/getAllFamilies",
  familyController.getAllFamilies
);
module.exports = router;