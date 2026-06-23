// routes/DonationRoutes.js

const express = require("express");

const {
  createDonation,
  getAllDonations,
  getDonationById,
  cancelDonation,
} = require("../controllers/DonationController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Donation
 *   description: Dharamshala donation management APIs
 */

/**
 * @swagger
 * /admin/donation/create:
 *   post:
 *     summary: Create donation
 *     tags: [Donation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - dharamshalaId
 *               - donorType
 *               - donationType
 *               - purpose
 *               - paymentMode
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "ADMIN_USER_ID"
 *               dharamshalaId:
 *                 type: string
 *                 example: "DHARAMSHALA_ID"
 *               donorType:
 *                 type: string
 *                 enum: [REGISTERED_MEMBER, EXTERNAL_DONOR]
 *                 example: "EXTERNAL_DONOR"
 *               donorUserId:
 *                 type: string
 *                 example: "USER_ID"
 *               externalDonorName:
 *                 type: string
 *                 example: "Ramesh Patel"
 *               externalMobileNumber:
 *                 type: string
 *                 example: "9876543210"
 *               externalAddress:
 *                 type: string
 *                 example: "Indore, Madhya Pradesh"
 *               donationType:
 *                 type: string
 *                 enum: [MONEY, ITEM]
 *                 example: "MONEY"
 *               amount:
 *                 type: number
 *                 example: 1100
 *               itemName:
 *                 type: string
 *                 example: "Fan"
 *               quantity:
 *                 type: number
 *                 example: 2
 *               purpose:
 *                 type: string
 *                 example: "Dharamshala Maintenance"
 *               paymentMode:
 *                 type: string
 *                 enum: [CASH, UPI, CHEQUE, NEFT]
 *                 example: "CASH"
 *               transactionReference:
 *                 type: string
 *                 example: "UPI123456789"
 *               collectedBy:
 *                 type: string
 *                 example: "ADMIN_USER_ID"
 *               familyId:
 *                 type: string
 *                 example: "FAMILY_ID"
 *               remarks:
 *                 type: string
 *                 example: "Cash donation collected by committee member"
 *     responses:
 *       200:
 *         description: Donation created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to create donation
 */
router.post("/create", createDonation);

/**
 * @swagger
 * /admin/donation/getAll:
 *   get:
 *     summary: Get all donations
 *     tags: [Donation]
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: number
 *           example: 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: number
 *           example: 10
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: donorType
 *         schema:
 *           type: string
 *           enum: [REGISTERED_MEMBER, EXTERNAL_DONOR]
 *       - in: query
 *         name: donationType
 *         schema:
 *           type: string
 *           enum: [MONEY, ITEM]
 *       - in: query
 *         name: paymentMode
 *         schema:
 *           type: string
 *           enum: [CASH, UPI, CHEQUE, NEFT]
 *       - in: query
 *         name: depositStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, DEPOSITED]
 *       - in: query
 *         name: status
 *         schema:
 *           type: number
 *           enum: [0, 1, 2]
 *           example: 1
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *           example: "Ramesh"
 *       - in: query
 *         name: donorUserId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Records fetched successfully
 *       500:
 *         description: Failed to fetch donations
 */
router.get("/getAll", getAllDonations);

/**
 * @swagger
 * /admin/donation/getById/{id}:
 *   get:
 *     summary: Get donation by id
 *     tags: [Donation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "DONATION_ID"
 *     responses:
 *       200:
 *         description: Donation fetched successfully
 *       400:
 *         description: id is required
 *       404:
 *         description: Donation not found
 *       500:
 *         description: Failed to fetch donation
 */
router.get("/getById/:id", getDonationById);

/**
 * @swagger
 * /admin/donation/cancel/{id}:
 *   post:
 *     summary: Cancel donation
 *     tags: [Donation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "DONATION_ID"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "ADMIN_USER_ID"
 *               remarks:
 *                 type: string
 *                 example: "Donation cancelled due to wrong entry"
 *     responses:
 *       200:
 *         description: Donation cancelled successfully
 *       400:
 *         description: id is required
 *       404:
 *         description: Donation not found
 *       500:
 *         description: Failed to cancel donation
 */
router.post("/cancel/:id", cancelDonation);

module.exports = router;