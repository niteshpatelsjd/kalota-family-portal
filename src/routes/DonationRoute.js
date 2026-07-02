// routes/DonationRoutes.js

const express = require("express");
const multer = require("multer");
// Multer setup (memory storage so we can pass buffer to fileUtil)

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
const upload = multer({ storage });

const {
  createDonation,
  getAllDonations,
  getDonationById,
  cancelDonation,
  depositCashDonation,
  verifyItemDonation,
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
 *     description: Creates donation record and voucher. Ledger is created only for confirmed ONLINE money donation. Committee cash/UPI/cheque/NEFT donations stay pending until deposit API is called.
 *     tags: [Donation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dharamshalaId
 *               - donorType
 *               - donationSource
 *               - donationType
 *               - purpose
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
 *                 example: "REGISTERED_MEMBER"
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
 *               familyId:
 *                 type: string
 *                 example: "FAMILY_ID"
 *               donationSource:
 *                 type: string
 *                 enum: [ONLINE, COMMITTEE_COLLECTION, DIRECT_OFFICE]
 *                 example: "COMMITTEE_COLLECTION"
 *               donationType:
 *                 type: string
 *                 enum: [MONEY, ITEM]
 *                 example: "MONEY"
 *               amount:
 *                 type: number
 *                 description: Required for MONEY donations; calculated as quantity multiplied by price for ITEM donations.
 *                 example: 2100
 *               price:
 *                 type: number
 *                 description: Price per unit, required for ITEM donations.
 *                 example: 850
 *               itemName:
 *                 type: string
 *                 description: Derived from the selected item for ITEM donations.
 *                 readOnly: true
 *                 example: "Fan"
 *               itemId:
 *                 type: string
 *                 description: Required for ITEM donations. Select from the Dharamshala item master.
 *                 example: "ITEM_ID"
 *               quantity:
 *                 type: number
 *                 example: 10
 *               purpose:
 *                 type: string
 *                 example: "Dharamshala Maintenance"
 *               paymentMode:
 *                 type: string
 *                 enum: [CASH, UPI, CHEQUE, NEFT, ONLINE, NA]
 *                 example: "CASH"
 *               transactionReference:
 *                 type: string
 *                 example: "UPI123456789"
 *               collectedBy:
 *                 type: string
 *                 example: "ADMIN_USER_ID"
 *               remarks:
 *                 type: string
 *                 example: "Cash collected by committee member"
 *           examples:
 *             committeeCashDonation:
 *               summary: Committee cash donation
 *               value:
 *                 dharamshalaId: "DHARAMSHALA_ID"
 *                 donorType: "REGISTERED_MEMBER"
 *                 donorUserId: "USER_ID"
 *                 donationSource: "COMMITTEE_COLLECTION"
 *                 donationType: "MONEY"
 *                 amount: 2100
 *                 purpose: "Dharamshala Maintenance"
 *                 paymentMode: "CASH"
 *                 collectedBy: "ADMIN_USER_ID"
 *                 remarks: "Cash collected by committee member"
 *             onlineDonation:
 *               summary: Online money donation
 *               value:
 *                 dharamshalaId: "DHARAMSHALA_ID"
 *                 donorType: "REGISTERED_MEMBER"
 *                 donorUserId: "USER_ID"
 *                 donationSource: "ONLINE"
 *                 donationType: "MONEY"
 *                 amount: 1100
 *                 purpose: "Dharamshala Maintenance"
 *                 paymentMode: "ONLINE"
 *                 transactionReference: "PAYMENT_GATEWAY_REF_123"
 *             itemDonation:
 *               summary: Item donation
 *               value:
 *                 dharamshalaId: "DHARAMSHALA_ID"
 *                 donorType: "REGISTERED_MEMBER"
 *                 donorUserId: "USER_ID"
 *                 donationSource: "COMMITTEE_COLLECTION"
 *                 donationType: "ITEM"
 *                 itemId: "ITEM_ID"
 *                 quantity: 10
 *                 price: 850
 *                 purpose: "Room Facility"
 *                 paymentMode: "NA"
 *                 collectedBy: "ADMIN_USER_ID"
 *                 remarks: "Fan promised by donor"
 *     responses:
 *       200:
 *         description: Donation created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Failed to create donation
 */
router.post(
  "/create",
  createDonation
);

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
 *         name: donorUserId
 *         schema:
 *           type: string
 *       - in: query
 *         name: donationSource
 *         schema:
 *           type: string
 *           enum: [ONLINE, COMMITTEE_COLLECTION, DIRECT_OFFICE]
 *       - in: query
 *         name: donationType
 *         schema:
 *           type: string
 *           enum: [MONEY, ITEM]
 *       - in: query
 *         name: paymentMode
 *         schema:
 *           type: string
 *           enum: [CASH, UPI, CHEQUE, NEFT, ONLINE, NA]
 *       - in: query
 *         name: collectionStatus
 *         schema:
 *           type: string
 *           enum: [NOT_REQUIRED, NOT_COLLECTED, COLLECTED, CANCELLED]
 *       - in: query
 *         name: depositStatus
 *         schema:
 *           type: string
 *           enum: [NOT_REQUIRED, PENDING, DEPOSITED, CANCELLED]
 *       - in: query
 *         name: itemStatus
 *         schema:
 *           type: string
 *           enum: [NOT_REQUIRED, PENDING_VERIFICATION, RECEIVED, PARTIALLY_RECEIVED, NOT_RECEIVED, CANCELLED]
 *       - in: query
 *         name: collectedBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: verifiedBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: familyId
 *         schema:
 *           type: string
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
 * /admin/donation/cancel:
 *   post:
 *     summary: Cancel donation
 *     tags: [Donation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - donationId
 *             properties:
 *               donationId:
 *                 type: string
 *                 example: "DONATION_ID"
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
 *         description: donationId is required
 *       404:
 *         description: Donation not found
 *       500:
 *         description: Failed to cancel donation
 */
router.post("/cancel", cancelDonation);

/**
 * @swagger
 * /admin/donation/depositCash:
 *   post:
 *     summary: Deposit pending cash donation
 *     description: Deposit pending cash donation, upload bank receipt and automatically create ledger.
 *     tags: [Donation]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - donationId
 *               - bankAccountId
 *             properties:
 *               donationId:
 *                 type: string
 *                 example: "676abc1234567890abcd1111"
 *               bankAccountId:
 *                 type: string
 *                 example: "676abc1234567890abcd2222"
 *               referenceNumber:
 *                 type: string
 *                 example: "SBI-CASH-DEP-2026-001"
 *               receiptFile:
 *                 type: string
 *                 format: binary
 *               remarks:
 *                 type: string
 *                 example: "Cash deposited to SBI bank account"
 *               updatedBy:
 *                 type: string
 *                 example: "676abc1234567890abcd3333"
 *
 *     responses:
 *       200:
 *         description: Donation deposited successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Donation or bank account not found
 *       500:
 *         description: Failed to deposit donation
 */
router.post(
  "/depositCash",
  upload.single("receiptFile"),
  depositCashDonation
);

/**
 * @swagger
 * /admin/donation/verifyItem:
 *   post:
 *     summary: Verify item donation
 *     description: Verify item donation such as Fan, Bulb, Cooler, Cement etc. Supports received, partially received, not received and cancelled status.
 *     tags: [Donation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - donationId
 *               - itemStatus
 *             properties:
 *               donationId:
 *                 type: string
 *                 example: "676abc1234567890abcd1111"
 *               itemStatus:
 *                 type: string
 *                 enum:
 *                   - RECEIVED
 *                   - PARTIALLY_RECEIVED
 *                   - NOT_RECEIVED
 *                   - CANCELLED
 *                 example: "PARTIALLY_RECEIVED"
 *               receivedQuantity:
 *                 type: number
 *                 example: 6
 *               notReceivedReason:
 *                 type: string
 *                 example: "Donor promised 10 fans but did not submit any item"
 *               remarks:
 *                 type: string
 *                 example: "Only 6 fans received by Dharamshala office"
 *               updatedBy:
 *                 type: string
 *                 description: Optional admin user id. If not provided, it will be taken from auth token.
 *                 example: "676abc1234567890abcd3333"
 *     responses:
 *       200:
 *         description: Item donation verified successfully
 *       400:
 *         description: Invalid request or item donation already verified
 *       404:
 *         description: Donation not found
 *       500:
 *         description: Failed to verify item donation
 */
router.post(
  "/verifyItem",
  verifyItemDonation
);
module.exports = router;
