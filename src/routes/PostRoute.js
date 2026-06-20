const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
  createPost,
  getFeed,
  likeUnlikePost,
  addComment,
  getComments,
  viewPost,
  sharePost,
} = require("../controllers/PostController");

/**
 * @swagger
 * tags:
 *   name: Post
 *   description: Post management APIs
 */

/**
 * @swagger
 * /admin/post/createPost:
 *   post:
 *     summary: Create a new post or event
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               title:
 *                 type: string
 *                 example: Annual Samaj Meeting
 *               description:
 *                 type: string
 *                 example: Meeting will be held at Kalota Dharamshala.
 *               type:
 *                 type: string
 *                 enum: [POST, EVENT]
 *                 example: EVENT
 *               eventDate:
 *                 type: string
 *                 example: 20-06-2026 18:30:00
 *               dharamshalaId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Post created successfully
 */
router.post(
  "/createPost",
  upload.array("media", 10),
  createPost
);

/**
 * @swagger
 * /admin/post/getFeed:
 *   get:
 *     summary: Get post feed with cursor pagination
 *     tags: [Post]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         example: 6853ac3e6c6f4e00123abcd1
 *         description: Filter posts created by a specific user
 *
 *       - in: query
 *         name: dharamshalaId
 *         required: false
 *         schema:
 *           type: string
 *         example: 6853ac3e6c6f4e00123abcd9
 *         description: Filter posts of a specific dharamshala
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema:
 *           type: string
 *         example: 2026-06-19T10:30:00.000Z
 *         description: Cursor returned from previous API call
 *
 *     responses:
 *       200:
 *         description: Posts fetched successfully
 */
router.get(
  "/getFeed",
  getFeed
);
  
  

/**
 * @swagger
 * /admin/post/likeUnlike:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - userId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               userId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd1
 *     responses:
 *       200:
 *         description: Post liked or unliked successfully
 */
router.post("/likeUnlike", likeUnlikePost);

/**
 * @swagger
 * /admin/post/addComment:
 *   post:
 *     summary: Add comment on post
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - userId
 *               - comment
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               userId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd1
 *               comment:
 *                 type: string
 *                 example: Very nice post
 *               parentCommentId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abce1
 *     responses:
 *       200:
 *         description: Comment added successfully
 */
router.post("/addComment", addComment);

/**
 * @swagger
 * /admin/post/viewPost:
 *   post:
 *     summary: Register post view
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               userId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd1
 *               deviceId:
 *                 type: string
 *                 example: iphone-15-device-id
 *     responses:
 *       200:
 *         description: Post viewed successfully
 */
router.post("/viewPost", viewPost);

/**
 * @swagger
 * /admin/post/getComments:
 *   get:
 *     summary: Get post comments
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           example: 6853ac3e6c6f4e00123abcd9
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           example: 2026-06-19T10:30:00.000Z
 *     responses:
 *       200:
 *         description: Comments fetched successfully
 */
router.get(
  "/getComments",
  
  getComments
);
/**
 * @swagger
 * /admin/post/sharePost:
 *   post:
 *     summary: Increase post share count
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *     responses:
 *       200:
 *         description: Post shared successfully
 */
router.post(
  "/sharePost",
  
  sharePost
);

module.exports = router;