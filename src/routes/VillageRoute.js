// routes/villageRoutes.js

const express = require("express");
const router = express.Router();

const villageController = require("../controllers/VillageController");

/**
 * @openapi
 * tags:
 *   name: Village Controller
 *   description: Village management APIs
 */

/**
 * @openapi
 * /admin/village/addVillage:
 *   post:
 *     tags: [Village Controller]
 *     summary: Add or update village
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
 *               tehsilId:
 *                 type: string
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Village added successfully
 */
router.post("/addVillage", villageController.addVillage);

/**
 * @openapi
 * /admin/village/getById:
 *   get:
 *     tags: [Village Controller]
 *     summary: Get village by ID
 *     parameters:
 *       - in: query
 *         name: villageId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Village details
 */
router.get("/getById", villageController.getVillageById);

/**
 * @openapi
 * /admin/village/getByName:
 *   get:
 *     tags: [Village Controller]
 *     summary: Get village by name
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Village details
 */
router.get("/getByName", villageController.getVillageByName);

/**
 * @openapi
 * /admin/village/info:
 *   get:
 *     tags: [Village Controller]
 *     summary: Get village info
 *     parameters:
 *       - in: query
 *         name: villageId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Village info
 */
router.get("/info", villageController.getVillageInfo);

/**
 * @openapi
 * /admin/village/getAllVillage:
 *   get:
 *     tags: [Village Controller]
 *     summary: Get all villages
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
 *         name: tehsilId
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
 *         description: List of villages
 */
router.get("/getAllVillage", villageController.getAllVillages);

/**
 * @openapi
 * /admin/village/blockUnblock:
 *   post:
 *     tags: [Village Controller]
 *     summary: Block or unblock village
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
 *         description: Village status updated
 */
router.post(
  "/blockUnblock",
  villageController.blockUnblockVillage
);

module.exports = router;