const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/LocationController");

/**
 * @openapi
 * tags:
 *   name: Location Controller
 *   description: Location management APIs
 */

/**
 * @openapi
 * /admin/location/addLocation:
 *   post:
 *     tags: [Location Controller]
 *     summary: Add or update a location
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - district
 *               - tehsil
 *               - village
 *             properties:
 *               id:
 *                 type: string
 *                 description: Leave empty for new location, provide ID for update
 *                 example: ""
 *               district:
 *                 type: string
 *                 description: District name
 *                 example: "Jaipur"
 *               tehsil:
 *                 type: string
 *                 description: Tehsil name
 *                 example: "Amer"
 *               village:
 *                 type: string
 *                 description: Village name
 *                 example: "Kanota"
 *               latitude:
 *                 type: number
 *                 description: Latitude coordinate
 *                 example: 26.9124
 *               longitude:
 *                 type: number
 *                 description: Longitude coordinate
 *                 example: 75.7873
 *               status:
 *                 type: integer
 *                 description: Status (0=deleted, 1=active, 2=inactive)
 *                 example: 1
 *     responses:
 *       200:
 *         description: Location added/updated successfully
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: Location not found (for update)
 *       500:
 *         description: Internal server error
 */
router.post("/addLocation", ctrl.addLocation);

/**
 * @openapi
 * /admin/location/getById/{id}:
 *   get:
 *     tags: [Location Controller]
 *     summary: Get location by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location details
 */
router.get("/getById/:id", ctrl.getLocationById);

/**
 * @openapi
 * /admin/location/getAllLocations:
 *   get:
 *     tags: [Location Controller]
 *     summary: Get all locations with pagination and filters
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
 *         name: searchText
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: tehsil
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of locations
 */
router.get("/getAllLocations", ctrl.getAllLocations);

/**
 * @openapi
 * /admin/location/blockUnblock:
 *   post:
 *     tags: [Location Controller]
 *     summary: Activate / deactivate / delete a location
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
 *                 example: 1
 *     responses:
 *       200:
 *         description: Status updated
 */
router.post("/blockUnblock", ctrl.blockUnblock);

/**
 * @openapi
 * /admin/location/getDistricts:
 *   get:
 *     tags: [Location Controller]
 *     summary: Get all distinct districts (for dropdown)
 *     responses:
 *       200:
 *         description: List of district names
 */
router.get("/getDistricts", ctrl.getDistricts);

/**
 * @openapi
 * /admin/location/getTehsils:
 *   get:
 *     tags: [Location Controller]
 *     summary: Get tehsils by district (for dropdown)
 *     parameters:
 *       - in: query
 *         name: district
 *         required: true
 *         schema:
 *           type: string
 *         example: "Jaipur"
 *     responses:
 *       200:
 *         description: List of tehsil names
 */
router.get("/getTehsils", ctrl.getTehsilsByDistrict);

/**
 * @openapi
 * /admin/location/getVillages:
 *   get:
 *     tags: [Location Controller]
 *     summary: Get villages by district and tehsil (for dropdown)
 *     parameters:
 *       - in: query
 *         name: district
 *         required: true
 *         schema:
 *           type: string
 *         example: "Jaipur"
 *       - in: query
 *         name: tehsil
 *         required: true
 *         schema:
 *           type: string
 *         example: "Amer"
 *     responses:
 *       200:
 *         description: List of villages with lat/long
 */
router.get("/getVillages", ctrl.getVillagesByTehsil);

module.exports = router;
