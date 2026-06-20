const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/NotificationController");
/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: Notification management APIs
 */

/**
 * @swagger
 * /admin/notification/create:
 *   post:
 *     summary: Create notification only
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *                 example: Registration Approved
 *               message:
 *                 type: string
 *                 example: Your family registration has been approved.
 *               type:
 *                 type: string
 *                 example: REGISTRATION
 *               data:
 *                 type: object
 *                 example:
 *                   screen: Profile
 *                   familyId: FAM-0001
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification created successfully
 */
router.post("/create", notificationController.createNotification);

/**
 * @swagger
 * /admin/notification/sendToUser:
 *   post:
 *     summary: Send notification to single user
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *                 example: Donation Received
 *               message:
 *                 type: string
 *                 example: Your donation receipt has been generated.
 *               type:
 *                 type: string
 *                 example: DONATION
 *               data:
 *                 type: object
 *                 example:
 *                   screen: DonationDetail
 *                   donationId: 65f1ab123456789
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification sent successfully
 */
router.post("/sendToUser", notificationController.sendNotificationToUser);

/**
 * @swagger
 * /admin/notification/sendToAll:
 *   post:
 *     summary: Send notification to all approved active users
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 example: New Announcement
 *               message:
 *                 type: string
 *                 example: New samaj announcement published.
 *               type:
 *                 type: string
 *                 example: GENERAL
 *               data:
 *                 type: object
 *                 example:
 *                   screen: Announcements
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk notification processed successfully
 */
router.post("/sendToAll", notificationController.sendNotificationToAll);

/**
 * @swagger
 * /admin/notification/getAll:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notification]
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           example: 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           example: GENERAL
 *       - in: query
 *         name: sentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, FAILED]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 */
router.get("/getAll", notificationController.getAllNotifications);

/**
 * @swagger
 * /admin/notification/getByUser/{userId}:
 *   get:
 *     summary: Get notifications by user
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           example: 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: User notifications fetched successfully
 */
router.get("/getByUser/:userId", notificationController.getNotificationsByUser);

/**
 * @swagger
 * /admin/notification/getById/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification fetched successfully
 *       404:
 *         description: Notification not found
 */
router.get("/getById/:id", notificationController.getNotificationById);

/**
 * @swagger
 * /admin/notification/markAsRead/{id}:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put("/markAsRead/:id", notificationController.markAsRead);

/**
 * @swagger
 * /admin/notification/markAllAsRead/{userId}:
 *   put:
 *     summary: Mark all user notifications as read
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put("/markAllAsRead/:userId", notificationController.markAllAsRead);

/**
 * @swagger
 * /admin/notification/delete/{id}:
 *   post:
 *     summary: Soft delete notification
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
router.post("/delete/:id", notificationController.deleteNotification);

module.exports = router;