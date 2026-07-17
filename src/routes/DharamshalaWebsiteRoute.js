const express = require("express");
const multer = require("multer");


const router = express.Router();
const ctrl = require("../controllers/DharamshalaWebsiteController");

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/**
 * @openapi
 * tags:
 *   - name: Dharamshala Website Controller
 *     description: Public website content APIs for Dharamshala
 */

/**
 * @openapi
 * /admin/dharamshala/website/addUpdate:
 *   post:
 *     tags: [Dharamshala Website Controller]
 *     summary: Create or update public website content for dharamshala
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - dharamshalaId
 *             properties:
 *               id:
 *                 type: string
 *                 example: "6853ac3e6c6f4e00123abcd9"
 *               dharamshalaId:
 *                 type: string
 *                 example: "6a5474760ac39d43c8889c89"
 *               slug:
 *                 type: string
 *                 example: "shriram-dharamshala-pipalyasadak"
 *               domain:
 *                 type: string
 *                 example: "shriramdharamshala.com"
 *               heroTitle:
 *                 type: string
 *                 example: "Shriram Dharamshala Piplaysadak"
 *               heroSubtitle:
 *                 type: string
 *                 example: "Community dharamshala for family and social events"
 *               aboutTitle:
 *                 type: string
 *                 example: "About Dharamshala"
 *               aboutDescription:
 *                 type: string
 *                 example: "Main community dharamshala for Kalota Samaj"
 *               bannerImage:
 *                 type: string
 *                 example: "https://res.cloudinary.com/demo/banner.jpg"
 *               logoImage:
 *                 type: string
 *                 example: "https://res.cloudinary.com/demo/logo.jpg"
 *               contactNumber:
 *                 type: string
 *                 example: "9876543210"
 *               alternateContactNumber:
 *                 type: string
 *                 example: "9876543211"
 *               contactEmail:
 *                 type: string
 *                 example: "info@test.com"
 *               website:
 *                 type: string
 *                 example: "https://example.com"
 *               address:
 *                 type: string
 *                 example: "Near Khati Samaj Dharamshala, Pipalyasadak"
 *               latitude:
 *                 type: number
 *                 example: 23.179089
 *               longitude:
 *                 type: number
 *                 example: 76.154424
 *               bookingEnabled:
 *                 type: boolean
 *                 example: true
 *               donationEnabled:
 *                 type: boolean
 *                 example: true
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Rooms", "Hall", "Kitchen", "Drinking Water"]
 *               rules:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Booking confirmation depends on availability"]
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [IMAGE, VIDEO]
 *                     url:
 *                       type: string
 *                     title:
 *                       type: string
 *               seoTitle:
 *                 type: string
 *                 example: "Shriram Dharamshala Piplaysadak"
 *               seoDescription:
 *                 type: string
 *                 example: "Book and view dharamshala facilities"
 *               status:
 *                 type: number
 *                 example: 1
 *               createdBy:
 *                 type: string
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Website content saved successfully
 */
router.post(
  "/addUpdate",
  upload.fields([
    { name: "bannerImageFile", maxCount: 1 },
    { name: "logoImageFile", maxCount: 1 },
  ]),
  ctrl.addUpdateWebsite
);

/**
 * @openapi
 * /admin/dharamshala/website/getByDharamshalaId/{dharamshalaId}:
 *   get:
 *     tags: [Dharamshala Website Controller]
 *     summary: Get website content by dharamshala id
 *     parameters:
 *       - in: path
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a5474760ac39d43c8889c89"
 *     responses:
 *       200:
 *         description: Website content fetched successfully
 */
router.get(
  "/getByDharamshalaId/:dharamshalaId",
  ctrl.getWebsiteByDharamshalaId
);

/**
 * @openapi
 * /admin/dharamshala/website/getByDharamshalaId:
 *   get:
 *     tags: [Dharamshala Website Controller]
 *     summary: Get website content by dharamshala id using query parameter
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a5474760ac39d43c8889c89"
 *     responses:
 *       200:
 *         description: Website content fetched successfully
 */
router.get("/getByDharamshalaId", ctrl.getWebsiteByDharamshalaId);

/**
 * @openapi
 * /admin/dharamshala/website/public/{slug}:
 *   get:
 *     tags: [Dharamshala Website Controller]
 *     summary: Get public website content by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: "shriram-dharamshala-pipalyasadak"
 *     responses:
 *       200:
 *         description: Public website content fetched successfully
 */
router.get("/public/:slug", ctrl.getPublicWebsiteBySlug);

/**
 * @openapi
 * /admin/dharamshala/website/blockUnblock:
 *   post:
 *     tags: [Dharamshala Website Controller]
 *     summary: Block, unblock or delete website content
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: string
 *                 example: "6853ac3e6c6f4e00123abcd9"
 *               status:
 *                 type: number
 *                 enum: [0, 1, 2]
 *                 example: 1
 *     responses:
 *       200:
 *         description: Website content status updated successfully
 */
router.post("/blockUnblock", ctrl.blockUnblockWebsite);

module.exports = router;
