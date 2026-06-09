// routes/tehsilRoutes.js

const express = require("express");
const router = express.Router();

const tehsilController = require("../controllers/TehsilController");

/**
 * @openapi
 * tags:
 *   name: Tehsil Controller
 *   description: Tehsil management APIs
 */

/**
 * @openapi
 * /admin/tehsil/addTehsil:
 *   post:
 *     tags: [Tehsil Controller]
 *     summary: Add or update tehsil
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               districtId:
 *                 type: string
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tehsil added successfully
 */
router.post("/addTehsil", tehsilController.addTehsil);

/**
 * @openapi
 * /admin/tehsil/getById:
 *   get:
 *     tags: [Tehsil Controller]
 *     summary: Get tehsil by ID
 *     parameters:
 *       - in: query
 *         name: tehsilId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Tehsil details
 */
router.get("/getById", tehsilController.getTehsilById);

/**
 * @openapi
 * /admin/tehsil/getByName:
 *   get:
 *     tags: [Tehsil Controller]
 *     summary: Get tehsil by name
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Tehsil details
 */
router.get("/getByName", tehsilController.getTehsilByName);

/**
 * @openapi
 * /admin/tehsil/info:
 *   get:
 *     tags: [Tehsil Controller]
 *     summary: Get tehsil info
 *     parameters:
 *       - in: query
 *         name: tehsilId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Tehsil info
 */
router.get("/info", tehsilController.getTehsilInfo);

/**
 * @openapi
 * /admin/tehsil/getAllTehsil:
 *   get:
 *     tags: [Tehsil Controller]
 *     summary: Get all tehsils
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
 *         name: districtId
 *         schema:
 *           type: string
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
 *         description: List of tehsils
 */
router.get("/getAllTehsil", tehsilController.getAllTehsils);

/**
 * @openapi
 * /admin/tehsil/blockUnblock:
 *   post:
 *     tags: [Tehsil Controller]
 *     summary: Block or unblock tehsil
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
 *         description: Tehsil status updated
 */
router.post(
  "/blockUnblock",
  tehsilController.blockUnblockTehsil
);

module.exports = router;