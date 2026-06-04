const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/MemberController");

/**
 * @openapi
 * tags:
 *   name: Member Admin Controller
 *   description: Admin APIs for member approvals
 */

/**
 * @openapi
 * /admin/member/list:
 *   get:
 *     tags: [Member Admin Controller]
 *     summary: Get all registered members
 */
router.get("/list", ctrl.getAllMembers);

/**
 * @openapi
 * /admin/member/pending:
 *   get:
 *     tags: [Member Admin Controller]
 *     summary: Get pending member registrations
 */
router.get("/pending", ctrl.getPendingMembers);

/**
 * @openapi
 * /admin/member/approve:
 *   post:
 *     tags: [Member Admin Controller]
 *     summary: Approve member registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "memberId"
 */
router.post("/approve", ctrl.approveMember);

/**
 * @openapi
 * /admin/member/reject:
 *   post:
 *     tags: [Member Admin Controller]
 *     summary: Reject member registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "memberId"
 *               rejectionReason:
 *                 type: string
 *                 example: "Wrong family ID selected"
 */
router.post("/reject", ctrl.rejectMember);

module.exports = router;
