// routes/districtRoutes.js

const express = require("express");
const router = express.Router();

const districtController = require("../controllers/DistrictController");

/**
 * @openapi
 * tags:
 *   name: District Controller
 *   description: District management APIs
 */

/**
 * @openapi
 * /admin/district/addDistrict:
 *   post:
 *     tags: [District Controller]
 *     summary: Add or update district
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: District added successfully
 */
router.post("/addDistrict", districtController.addDistrict);

/**
 * @openapi
 * /admin/district/getById:
 *   get:
 *     tags: [District Controller]
 *     summary: Get district by ID
 *     parameters:
 *       - in: query
 *         name: districtId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: District details
 */
router.get("/getById", districtController.getDistrictById);

/**
 * @openapi
 * /admin/district/getByName:
 *   get:
 *     tags: [District Controller]
 *     summary: Get district by name
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: District details
 */
router.get("/getByName", districtController.getDistrictByName);

/**
 * @openapi
 * /admin/district/info:
 *   get:
 *     tags: [District Controller]
 *     summary: Get district info
 *     parameters:
 *       - in: query
 *         name: districtId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: District info
 */
router.get("/info", districtController.getDistrictInfo);

/**
 * @openapi
 * /admin/district/getAllDistrict:
 *   get:
 *     tags: [District Controller]
 *     summary: Get all districts
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
 *     responses:
 *       200:
 *         description: List of districts
 */
router.get("/getAllDistrict", districtController.getAllDistricts);

/**
 * @openapi
 * /admin/district/blockUnblock:
 *   post:
 *     tags: [District Controller]
 *     summary: Block or unblock district
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
 *     responses:
 *       200:
 *         description: District status updated
 */
router.post(
  "/blockUnblock",
  districtController.blockUnblockDistrict
);

module.exports = router;