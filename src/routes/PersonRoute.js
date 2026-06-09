// routes/PersonRoute.js

const express = require("express");

const router =
  express.Router();

const personController =
  require("../controllers/PersonController");

const upload =
  require("../middlewares/uploadMiddleware");

/**
 * @openapi
 * tags:
 *   - name: Person Controller
 *     description: Person management APIs
 */

/**
 * @openapi
 * /admin/person/createMember:
 *   post:
 *     tags: [Person Controller]
 *     summary: Create family member
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - familyId
 *               - relationType
 *               - firstName
 *               - lastName
 *               - villageId
 *             properties:
 *               familyId:
 *                 type: string
 *
 *               relationType:
 *                 type: string
 *                 enum:
 *                   - HEAD
 *                   - FATHER
 *                   - MOTHER
 *                   - SPOUSE
 *                   - SON
 *                   - DAUGHTER
 *                   - BROTHER
 *                   - SISTER
 *                   - GRANDSON
 *                   - GRANDDAUGHTER
 *
 *               linkedPersonId:
 *                 type: string
 *                 description: Required for SPOUSE relation
 *
 *               nativeFamilyRefId:
 *                 type: string
 *                 description: Native family reference
 *
 *               marriedFamilyRefId:
 *                 type: string
 *                 description: Married/Sasural family reference
 *
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
 *               marriageDate:
 *                 type: string
 *                 example: "25-12-1995"
 *                 description: Date format should be dd-MM-yyyy
 *
 *               villageId:
 *                 type: string
 *
 *               parentVillageId:
 *                 type: string
 *                 description: Sasural village reference
 *
 *               spouseName:
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
 *               grandFatherFirstName:
 *                 type: string
 *
 *               grandFatherMiddleName:
 *                 type: string
 *
 *               grandFatherLastName:
 *                 type: string
 *
 *               isAlive:
 *                 type: boolean
 *
 *               deathDate:
 *                 type: string
 *                 example: "25-12-1995"
 *                 description: Date format should be dd-MM-yyyy
 *
 *               profileImage:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *       200:
 *         description: Member created successfully
 */
router.post(
  "/createMember",
  upload.single(
    "profileImage"
  ),
  personController.createMemberProfile
);

/**
 * @openapi
 * /admin/person/updateProfile:
 *   put:
 *     tags: [Person Controller]
 *     summary: Update member profile
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - personId
 *             properties:
 *               personId:
 *                 type: string
 *
 *               linkedPersonId:
 *                 type: string
 *
 *               nativeFamilyRefId:
 *                 type: string
 *
 *               marriedFamilyRefId:
 *                 type: string
 *
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
 *               marriageDate:
 *                 type: string
 *                 example: "25-12-1995"
 *                 description: Date format should be dd-MM-yyyy
 *
 *               villageId:
 *                 type: string
 *
 *               parentVillageId:
 *                 type: string
 *
 *               spouseName:
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
 *               grandFatherFirstName:
 *                 type: string
 *
 *               grandFatherMiddleName:
 *                 type: string
 *
 *               grandFatherLastName:
 *                 type: string
 *
 *               isAlive:
 *                 type: boolean
 *
 *               deathDate:
 *                 type: string
 *                 example: "25-12-1995"
 *                 description: Date format should be dd-MM-yyyy
 *
 *               profileImage:
 *                 type: string
 *                 format: binary
 *
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  "/updateProfile",
  upload.single(
    "profileImage"
  ),
  personController.updateProfile
);

/**
 * @openapi
 * /admin/person/deleteProfile:
 *   delete:
 *     tags: [Person Controller]
 *     summary: Delete member profile
 *     parameters:
 *       - in: query
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 */
router.delete(
  "/deleteProfile",
  personController.deleteProfile
);

/**
 * @openapi
 * /admin/person/getProfile:
 *   get:
 *     tags: [Person Controller]
 *     summary: Get profile by personId
 *     parameters:
 *       - in: query
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile details fetched successfully
 */
router.get(
  "/getProfile",
  personController.getProfileById
);

module.exports =
  router;