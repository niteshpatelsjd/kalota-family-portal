const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/BookingController");

/**
 * @openapi
 * tags:
 *   - name: Booking Controller
 *     description: Dharamshala booking management APIs
 */

/**
 * @openapi
 * /admin/booking/addUpdateBookingUnit:
 *   post:
 *     tags: [Booking Controller]
 *     summary: Add or update bookable Dharamshala unit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dharamshalaId, unitName, unitType]
 *             properties:
 *               id:
 *                 type: string
 *               dharamshalaId:
 *                 type: string
 *               unitName:
 *                 type: string
 *                 example: Main Hall
 *               unitType:
 *                 type: string
 *                 enum: [ROOM, HALL, KITCHEN, DINING, GROUND, FULL_DHARAMSHALA, OTHER]
 *               capacity:
 *                 type: number
 *               basePrice:
 *                 type: number
 *               securityDeposit:
 *                 type: number
 *               description:
 *                 type: string
 *               createdBy:
 *                 type: string
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking unit created or updated successfully
 */
router.post("/addUpdateBookingUnit", ctrl.addUpdateBookingUnit);

/**
 * @openapi
 * /admin/booking/getAllBookingUnit:
 *   get:
 *     tags: [Booking Controller]
 *     summary: Get all booking units
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: unitType
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
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking units fetched successfully
 */
router.get("/getAllBookingUnit", ctrl.getAllBookingUnit);

/**
 * @openapi
 * /admin/booking/blockUnblockBookingUnit:
 *   post:
 *     tags: [Booking Controller]
 *     summary: Block, unblock or delete booking unit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, status]
 *             properties:
 *               id:
 *                 type: string
 *               status:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: 0 deleted, 1 active, 2 blocked
 *     responses:
 *       200:
 *         description: Booking unit status updated successfully
 */
router.post("/blockUnblockBookingUnit", ctrl.blockUnblockBookingUnit);

/**
 * @openapi
 * /admin/booking/checkAvailability:
 *   get:
 *     tags: [Booking Controller]
 *     summary: Check booking unit availability
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         required: true
 *         schema:
 *           type: string
 *           example: 20-08-2026
 *       - in: query
 *         name: toDate
 *         required: true
 *         schema:
 *           type: string
 *           example: 22-08-2026
 *     responses:
 *       200:
 *         description: Availability checked successfully
 */
router.get("/checkAvailability", ctrl.checkAvailability);

/**
 * @openapi
 * /admin/booking/createBooking:
 *   post:
 *     tags: [Booking Controller]
 *     summary: Create booking request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dharamshalaId, unitId, userId, bookingFromDate, bookingToDate]
 *             properties:
 *               dharamshalaId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               userId:
 *                 type: string
 *               eventType:
 *                 type: string
 *                 example: MARRIAGE
 *               bookingFromDate:
 *                 type: string
 *                 example: 20-08-2026
 *               bookingToDate:
 *                 type: string
 *                 example: 22-08-2026
 *               checkInTime:
 *                 type: string
 *                 example: "10:00"
 *               checkOutTime:
 *                 type: string
 *                 example: "18:00"
 *               guestCount:
 *                 type: number
 *               purpose:
 *                 type: string
 *               bookingAmount:
 *                 type: number
 *               securityDeposit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Booking created successfully
 */
router.post("/createBooking", ctrl.createBooking);

/**
 * @openapi
 * /admin/booking/getAllBooking:
 *   get:
 *     tags: [Booking Controller]
 *     summary: Get all bookings
 *     parameters:
 *       - in: query
 *         name: dharamshalaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: familyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4, 5]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3, 4]
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bookings fetched successfully
 */
router.get("/getAllBooking", ctrl.getAllBooking);

/**
 * @openapi
 * /admin/booking/getBookingById:
 *   get:
 *     tags: [Booking Controller]
 *     summary: Get booking by id
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking fetched successfully
 */
router.get("/getBookingById", ctrl.getBookingById);

/**
 * @openapi
 * /admin/booking/approveRejectBooking:
 *   post:
 *     tags: [Booking Controller]
 *     summary: Approve or reject booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, action]
 *             properties:
 *               bookingId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               approvedBy:
 *                 type: string
 *               rejectedBy:
 *                 type: string
 *               remark:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking approved or rejected successfully
 */
router.post("/approveRejectBooking", ctrl.approveRejectBooking);

/**
 * @openapi
 * /admin/booking/cancelBooking:
 *   post:
 *     tags: [Booking Controller]
 *     summary: Cancel booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:
 *                 type: string
 *               cancelledBy:
 *                 type: string
 *               cancelReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */
router.post("/cancelBooking", ctrl.cancelBooking);

/**
 * @openapi
 * /admin/booking/blockUnblockBooking:
 *   post:
 *     tags: [Booking Controller]
 *     summary: Block, unblock or delete booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, status]
 *             properties:
 *               id:
 *                 type: string
 *               status:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: 0 deleted, 1 active, 2 blocked
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 */
router.post("/blockUnblockBooking", ctrl.blockUnblockBooking);

module.exports = router;
