const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/FamilyController");

/**
 * @openapi
 * tags:
 *   name: Family Controller
 *   description: Family and family profile management APIs
 */

/**
 * @openapi
 * /admin/family/create:
 *   post:
 *     tags: [Family Controller]
 *     summary: Create a new family with head profile and additional profiles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - headProfile
 *             properties:
 *               familyId:
 *                 type: string
 *                 description: Optional custom familyId, auto-generated if not provided
 *                 example: ""
 *               headProfile:
 *                 type: object
 *                 required:
 *                   - name
 *                   - district
 *                   - tehsil
 *                   - village
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Dilip Singh Patel"
 *                   dob:
 *                     type: string
 *                     format: date
 *                     example: "1970-12-01"
 *                   gender:
 *                     type: string
 *                     enum: [MALE, FEMALE, OTHER]
 *                     example: "MALE"
 *                   isMarried:
 *                     type: boolean
 *                     example: true
 *                   occupation:
 *                     type: string
 *                     example: "Farmer"
 *                   education:
 *                     type: string
 *                     example: "Graduation"
 *                   mobileNumber:
 *                     type: string
 *                     example: "9876543210"
 *                   email:
 *                     type: string
 *                     example: "dilip@gmail.com"
 *                   fatherName:
 *                     type: string
 *                     example: "Ramchandra Patel"
 *                   motherName:
 *                     type: string
 *                     example: "Savitri Patel"
 *                   grandFatherName:
 *                     type: string
 *                     example: "Shivlal Patel"
 *                   district:
 *                     type: string
 *                     example: "Dewas"
 *                   tehsil:
 *                     type: string
 *                     example: "Tonkkhurd"
 *                   village:
 *                     type: string
 *                     example: "Piplayasadak"
 *                   profileImage:
 *                     type: string
 *                     example: ""
 *                   spouseFamilyId:
 *                     type: string
 *                     example: ""
 *                   spouseDetails:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Maya Patel"
 *                         fatherName:
 *                           type: string
 *                           example: "Sohan Patel"
 *                         district:
 *                           type: string
 *                           example: "Dewas"
 *                         tehsil:
 *                           type: string
 *                           example: "Tonkkhurd"
 *                         village:
 *                           type: string
 *                           example: "Piplayasadak"
 *                         familyId:
 *                           type: string
 *                           example: ""
 *               profiles:
 *                 type: array
 *                 description: Additional family members to add along with head
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - relationToHead
 *                   properties:
 *                     relationToHead:
 *                       type: string
 *                       enum: [HEAD, FATHER, MOTHER, SPOUSE, SISTER, SON, DAUGHTER, GRANDSON, GRANDDAUGHTER, OTHER]
 *                       example: "SPOUSE"
 *                     name:
 *                       type: string
 *                       example: "Maya Patel"
 *                     dob:
 *                       type: string
 *                       format: date
 *                       example: "1975-06-15"
 *                     gender:
 *                       type: string
 *                       enum: [MALE, FEMALE, OTHER]
 *                       example: "FEMALE"
 *                     isMarried:
 *                       type: boolean
 *                       example: true
 *                     occupation:
 *                       type: string
 *                       example: "Homemaker"
 *                     education:
 *                       type: string
 *                       example: "Secondary"
 *                     mobileNumber:
 *                       type: string
 *                       example: "9876543211"
 *                     email:
 *                       type: string
 *                       example: "maya@gmail.com"
 *                     fatherName:
 *                       type: string
 *                       example: "Sohan Patel"
 *                     motherName:
 *                       type: string
 *                       example: "Geeta Patel"
 *                     grandFatherName:
 *                       type: string
 *                       example: ""
 *                     district:
 *                       type: string
 *                       example: "Dewas"
 *                     tehsil:
 *                       type: string
 *                       example: "Tonkkhurd"
 *                     village:
 *                       type: string
 *                       example: "Piplayasadak"
 *                     profileImage:
 *                       type: string
 *                       example: ""
 *                     parentProfileId:
 *                       type: string
 *                       example: ""
 *                     spouseFamilyId:
 *                       type: string
 *                       example: ""
 *     responses:
 *       201:
 *         description: Family created successfully
 *       400:
 *         description: Bad request - missing required fields
 *       409:
 *         description: FamilyId already exists
 *       500:
 *         description: Internal server error
 */
router.post("/create", ctrl.createFamily);

/**
 * @openapi
 * /admin/family/addProfile:
 *   post:
 *     tags: [Family Controller]
 *     summary: Add a new profile to an existing family
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - familyId
 *               - name
 *               - relationToHead
 *             properties:
 *               familyId:
 *                 type: string
 *                 example: "KFP-DEW-TON-PIP-0001"
 *               relationToHead:
 *                 type: string
 *                 enum: [HEAD, FATHER, MOTHER, SPOUSE, SISTER, SON, DAUGHTER, GRANDSON, GRANDDAUGHTER, OTHER]
 *                 example: "SON"
 *               name:
 *                 type: string
 *                 example: "Rohan Patel"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "2000-03-10"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               isMarried:
 *                 type: boolean
 *                 example: false
 *               occupation:
 *                 type: string
 *                 example: "Student"
 *               education:
 *                 type: string
 *                 example: "Higher Secondary"
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543212"
 *               email:
 *                 type: string
 *                 example: "rohan@gmail.com"
 *               fatherName:
 *                 type: string
 *                 example: "Dilip Singh Patel"
 *               motherName:
 *                 type: string
 *                 example: "Maya Patel"
 *               grandFatherName:
 *                 type: string
 *                 example: "Ramchandra Patel"
 *               district:
 *                 type: string
 *                 example: "Dewas"
 *               tehsil:
 *                 type: string
 *                 example: "Tonkkhurd"
 *               village:
 *                 type: string
 *                 example: "Piplayasadak"
 *               profileImage:
 *                 type: string
 *                 example: ""
 *               parentProfileId:
 *                 type: string
 *                 description: ObjectId of parent profile
 *                 example: ""
 *               spouseFamilyId:
 *                 type: string
 *                 example: ""
 *               spouseDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: ""
 *                     fatherName:
 *                       type: string
 *                       example: ""
 *                     district:
 *                       type: string
 *                       example: ""
 *                     tehsil:
 *                       type: string
 *                       example: ""
 *                     village:
 *                       type: string
 *                       example: ""
 *                     familyId:
 *                       type: string
 *                       example: ""
 *     responses:
 *       201:
 *         description: Family profile added successfully
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: Family not found
 *       500:
 *         description: Internal server error
 */
router.post("/addProfile", ctrl.addProfile);

/**
 * @openapi
 * /admin/family/updateProfile/{id}:
 *   put:
 *     tags: [Family Controller]
 *     summary: Update an existing family profile by profile ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: FamilyProfile ObjectId
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dilip Singh Patel"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1970-12-01"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               isMarried:
 *                 type: boolean
 *                 example: true
 *               occupation:
 *                 type: string
 *                 example: "Farmer"
 *               education:
 *                 type: string
 *                 example: "Graduation"
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 example: "dilip@gmail.com"
 *               fatherName:
 *                 type: string
 *                 example: "Ramchandra Patel"
 *               motherName:
 *                 type: string
 *                 example: "Savitri Patel"
 *               grandFatherName:
 *                 type: string
 *                 example: "Shivlal Patel"
 *               district:
 *                 type: string
 *                 example: "Dewas"
 *               tehsil:
 *                 type: string
 *                 example: "Tonkkhurd"
 *               village:
 *                 type: string
 *                 example: "Piplayasadak"
 *               profileImage:
 *                 type: string
 *                 example: ""
 *               spouseFamilyId:
 *                 type: string
 *                 example: ""
 *               spouseDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Maya Patel"
 *                     fatherName:
 *                       type: string
 *                       example: "Sohan Patel"
 *                     district:
 *                       type: string
 *                       example: "Dewas"
 *                     tehsil:
 *                       type: string
 *                       example: "Tonkkhurd"
 *                     village:
 *                       type: string
 *                       example: "Piplayasadak"
 *                     familyId:
 *                       type: string
 *                       example: ""
 *               status:
 *                 type: integer
 *                 description: Status (0=deleted, 1=active, 2=inactive)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Family profile updated successfully
 *       404:
 *         description: Family profile not found
 *       500:
 *         description: Internal server error
 */
router.put("/updateProfile/:id", ctrl.updateProfile);

/**
 * @openapi
 * /admin/family/details/{familyId}:
 *   get:
 *     tags: [Family Controller]
 *     summary: Get full family details with all profiles by familyId
 *     parameters:
 *       - in: path
 *         name: familyId
 *         required: true
 *         description: Family ID (e.g. KFP-DEW-TON-PIP-0001)
 *         schema:
 *           type: string
 *         example: "KFP-DEW-TON-PIP-0001"
 *     responses:
 *       200:
 *         description: Family details with all profiles
 *       404:
 *         description: Family not found
 *       500:
 *         description: Internal server error
 */
router.get("/details/:familyId", ctrl.getFamilyDetails);

/**
 * @openapi
 * /admin/family/list:
 *   get:
 *     tags: [Family Controller]
 *     summary: Get paginated list of families with filters
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
 *         description: Search by familyId, district, tehsil or village
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         example: "Dewas"
 *       - in: query
 *         name: tehsil
 *         schema:
 *           type: string
 *         example: "Tonkkhurd"
 *       - in: query
 *         name: village
 *         schema:
 *           type: string
 *         example: "Piplayasadak"
 *     responses:
 *       200:
 *         description: Paginated list of families
 *       404:
 *         description: No records found
 *       500:
 *         description: Internal server error
 */
router.get("/list", ctrl.getAllFamilies);

/**
 * @openapi
 * /admin/family/search:
 *   get:
 *     tags: [Family Controller]
 *     summary: Search families for member registration dropdown (max 50 results)
 *     parameters:
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         example: "Dewas"
 *       - in: query
 *         name: tehsil
 *         schema:
 *           type: string
 *         example: "Tonkkhurd"
 *       - in: query
 *         name: village
 *         schema:
 *           type: string
 *         example: "Piplayasadak"
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Search by familyId, district, tehsil or village
 *     responses:
 *       200:
 *         description: List of family options for dropdown
 *       500:
 *         description: Internal server error
 */
router.get("/search", ctrl.searchFamiliesForRegistration);

/**
 * @openapi
 * /admin/family/blockUnblock:
 *   post:
 *     tags: [Family Controller]
 *     summary: Activate, deactivate or delete a family
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - familyId
 *               - status
 *             properties:
 *               familyId:
 *                 type: string
 *                 example: "KFP-DEW-TON-PIP-0001"
 *               status:
 *                 type: integer
 *                 description: Status (0=deleted, 1=active, 2=inactive)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Family status updated
 *       404:
 *         description: Family not found
 *       500:
 *         description: Internal server error
 */
router.post("/blockUnblock", ctrl.blockUnblockFamily);

module.exports = router;
