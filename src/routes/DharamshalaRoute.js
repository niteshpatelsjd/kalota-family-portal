/**
 * @openapi
 * tags:
 *   - name: Dharamshala Controller
 *     description: Dharamshala management APIs
 */

const express = require("express");

const router = express.Router();

const ctrl = require(
  "../controllers/DharamshalaController"
);

const jwtUtil =
  require("../utils/JwtUtil");

const multer = require("multer");

/* ─────────────────────────────────────
   MULTER CONFIG
───────────────────────────────────── */


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

const upload = multer({
  storage,
});

/* ─────────────────────────────────────
   AUTH MIDDLEWARE
───────────────────────────────────── */

function auth(req, res, next) {
  const h =
    req.headers.authorization || "";

  const t = h.startsWith("Bearer ")
    ? h.slice(7)
    : null;

  if (!t) {
    return res.status(401).json({
      error: "Missing token",
    });
  }

  try {
    req.user = jwtUtil.verify(t);

    next();
  } catch (e) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
}

/* ─────────────────────────────────────
   ADD / UPDATE DHARAMSHALA
───────────────────────────────────── */
/**
 * @openapi
 * /admin/dharamshala/addDharamshala:
 *   post:
 *     tags: [Dharamshala Controller]
 *     summary: Create or update Dharamshala / Trust
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "6851a6bc1f1f4e0e88aa1001"
 *               name:
 *                 type: string
 *                 example: "Shree Kalota Dharamshala"
 *               type:
 *                 type: string
 *                 enum: [DHARAMSHALA, TRUST]
 *                 example: "DHARAMSHALA"
 *               description:
 *                 type: string
 *                 example: "Main community dharamshala"
 *               villageId:
 *                 type: string
 *                 example: "6851a6bc1f1f4e0e88aa2001"
 *               address:
 *                 type: string
 *                 example: "Near Bus Stand, Dewas"
 *               latitude:
 *                 type: number
 *                 example: 22.9676
 *               longitude:
 *                 type: number
 *                 example: 76.0534
 *               mobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               alternateMobileNumber:
 *                 type: string
 *                 example: "9876543211"
 *               email:
 *                 type: string
 *                 example: "info@test.com"
 *               website:
 *                 type: string
 *                 example: "https://example.com"
 *               establishedYear:
 *                 type: string
 *                 example: "2001"
 *               status:
 *                 type: number
 *                 example: 1
 *               profileImageFile:
 *                 type: string
 *                 format: binary
 *               bannerImageFile:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Dharamshala / Trust created or updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */

router.post(
  "/addDharamshala",
  upload.fields([
    {
      name: "profileImageFile",
      maxCount: 1,
    },
    {
      name: "bannerImageFile",
      maxCount: 1,
    },
  ]),
  ctrl.addDharamshala
);

/* ─────────────────────────────────────
   GET BY ID
───────────────────────────────────── */

/**
 * @openapi
 * /admin/dharamshala/getDharamshalaById/{id}:
 *   get:
 *     tags: [Dharamshala Controller]
 *     summary: Get Dharamshala details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Dharamshala ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dharamshala details fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dharamshala not found
 */

router.get(
  "/getDharamshalaById/:id",



  ctrl.getDharamshalaById
);


/**
 * @openapi
 * /admin/dharamshala/nearby:
 *   get:
 *     tags: [Dharamshala Controller]
 *     summary: Get nearby villages and dharamshalas/trusts by latitude and longitude
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         example: 22.7196
 *         description: Current user latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         example: 75.8577
 *         description: Current user longitude
 *       - in: query
 *         name: radiusInKm
 *         required: false
 *         schema:
 *           type: number
 *           default: 25
 *         example: 25
 *         description: Search radius in kilometers
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ALL, VILLAGE, DHARAMSHALA, TRUST]
 *           default: ALL
 *         example: ALL
 *         description: Filter nearby result type
 *     responses:
 *       200:
 *         description: Nearby locations fetched successfully
 *       400:
 *         description: Invalid latitude or longitude
 *       401:
 *         description: Unauthorized
 */

router.get(
  "/nearby",
  ctrl.getNearbyLocations
);
/* ─────────────────────────────────────
   GET ALL
───────────────────────────────────── */

/**
 * @openapi
 * /admin/dharamshala/getAllDharamshala:
 *   get:
 *     tags: [Dharamshala Controller]
 *     summary: Get all Dharamshala list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Page index
 *
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Page size
 *
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Status filter
 *
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *           example: "Patel"
 *         description: Search by name
 * 
 *       - in: query
 *         name: villageId
 *         schema:
 *           type: string
 *           example: "6a2696f61ca30c297d0fabf3"
 *         description: Search by village
 *
 *     responses:
 *       200:
 *         description: Dharamshala list fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/getAllDharamshala",
  ctrl.getAllDharamshala
);


/**
 * @openapi
 * /admin/dharamshala/getDharamshalaAndTrustByVillage:
 *   get:
 *     tags: [Dharamshala Controller]
 *     summary: Get village Dharamshala along with all Trusts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: villageId
 *         required: true
 *         schema:
 *           type: string
 *           example: "6a2696f61ca30c297d0fabf3"
 *         description: Village ID
 *     responses:
 *       200:
 *         description: Records fetched successfully
 *       400:
 *         description: villageId is required
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/getDharamshalaAndTrustByVillage",
  ctrl.getDharamshalaAndTrustByVillage
);

/* ─────────────────────────────────────
   BLOCK / UNBLOCK / DELETE
───────────────────────────────────── */

/**
 * @openapi
 * /admin/dharamshala/blockUnblock:
 *   post:
 *     tags: [Dharamshala Controller]
 *     summary: Activate / Inactivate / Delete Dharamshala
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "6851a6bc1f1f4e0e88aa1001"
 *
 *               status:
 *                 type: integer
 *                 example: 1
 *                 description: |
 *                   0 = deleted
 *                   1 = active
 *                   2 = inactive
 *
 *     responses:
 *       200:
 *         description: Dharamshala status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dharamshala not found
 */

router.post(
  "/blockUnblock",



  ctrl.blockUnblockDharamshala
);

/* ─────────────────────────────────────
   TOTAL COUNT
───────────────────────────────────── */

/**
 * @openapi
 * /admin/dharamshala/getTotalDharamshalaCount:
 *   get:
 *     tags: [Dharamshala Controller]
 *     summary: Get total Dharamshala count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total count fetched successfully
 *       401:
 *         description: Unauthorized
 */

router.get(
  "/getTotalDharamshalaCount",


  ctrl.getTotalDharamshalaCount
);




/* ─────────────────────────────────────
   DHARAMSHALA COMMITTEE ROUTES
───────────────────────────────────── */

/**
 * @openapi
 * /admin/dharamshala/addCommittee:
 *   post:
 *     tags: [Dharamshala Controller]
 *     summary: Add or Update Dharamshala Committee Member
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "committeeId"
 *               dharamshalaId:
 *                 type: string
 *                 example: "6855dharamshalaId"
 *               userId:
 *                 type: string
 *                 example: "6855userId"
 *               committeeRole:
 *                 type: string
 *                 example: "PRESIDENT"
 *               joiningDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-10"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2027-06-10"
 *               remarks:
 *                 type: string
 *                 example: "Main committee member"
 *               removedReason:
 *                 type: string
 *                 example: "Term completed"
 *               status:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Committee member saved successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  "/addCommittee",
  ctrl.addDharamshalaCommittee
);

/**
 * @openapi
 * /admin/dharamshala/getAllCommittee:
 *   get:
 *     tags: [Dharamshala Controller]
 *     summary: Get all Dharamshala Committee Members
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *           example: "president"
 *     responses:
 *       200:
 *         description: Committee list fetched successfully
 *       404:
 *         description: Records not found
 */
router.get(
  "/getAllCommittee",
  ctrl.getAllDharamshalaCommittee
);

/**
 * @openapi
 * /admin/dharamshala/getCommitteeById/{id}:
 *   get:
 *     tags: [Dharamshala Controller]
 *     summary: Get Dharamshala Committee Member By ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Committee member fetched successfully
 *       404:
 *         description: Committee member not found
 */
router.get(
  "/getCommitteeById/:id",
  ctrl.getDharamshalaCommitteeById
);

/**
 * @openapi
 * /admin/dharamshala/blockUnblockCommittee:
 *   post:
 *     tags: [Dharamshala Controller]
 *     summary: Block / Unblock / Delete Committee Member
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "committeeId"
 *               status:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Committee member status updated successfully
 *       404:
 *         description: Committee member not found
 */
router.post(
  "/blockUnblockCommittee",
  ctrl.blockUnblockCommitteeMember
);

module.exports = router;