const express = require("express");
const router = express.Router();

// const multer = require("multer");
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

const multer =
  require("multer");

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
  createPost,
  getFeed,
  getLikers,
  getViewers,
  likeUnlikePost,
  addComment,
  getComments,
  viewPost,
  sharePost,
  editPost,
  deletePost
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
 * /admin/post/editPost:
 *   put:
 *     summary: Edit post or event
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               title:
 *                 type: string
 *                 example: Updated Post Title
 *               description:
 *                 type: string
 *                 example: Updated post description
 *               type:
 *                 type: string
 *                 enum: [POST, EVENT]
 *                 example: POST
 *               eventDate:
 *                 type: string
 *                 example: 20-06-2026 18:30:00
 *               dharamshalaId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               removeMediaUrls:
 *                 type: string
 *                 example: ["http://localhost:7000/uploads/posts/old.jpg"]
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 */
router.put(
  "/editPost",
  upload.array("media", 10),
  editPost
);



/**
 * @openapi
 * /admin/post/getViewers:
 *   get:
 *     tags: [Post]
 *     summary: Get post viewers
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: number
 *           example: 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: number
 *           example: 20
 *     responses:
 *       200:
 *         description: Viewers fetched successfully
 */
router.get("/getViewers", getViewers);

/**
 * @openapi
 * /admin/post/getLikers:
 *   get:
 *     tags: [Post]
 *     summary: Get post likers
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: number
 *           example: 0
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: number
 *           example: 20
 *     responses:
 *       200:
 *         description: Likers fetched successfully
 */
router.get("/getLikers", getLikers);


/**
 * @swagger
 * /admin/post/deletePost:
 *   delete:
 *     summary: Delete post softly
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
 *     responses:
 *       200:
 *         description: Post deleted successfully
 */
router.delete(
  "/deletePost",
  deletePost
);

/**
 * @swagger
 * /admin/post/getFeed:
 *   get:
 *     summary: Get public post feed with cursor pagination
 *     tags: [Post]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         example: 6853ac3e6c6f4e00123abcd1
 *         description: Logged-in user id. Used only for isLiked calculation.
 *
 *       - in: query
 *         name: targetUserId
 *         required: false
 *         schema:
 *           type: string
 *         example: 6853ac3e6c6f4e00123abcd2
 *         description: Optional profile user id. Use this only when fetching a specific user's posts.
 *
 *       - in: query
 *         name: dharamshalaId
 *         required: false
 *         schema:
 *           type: string
 *         example: 6853ac3e6c6f4e00123abcd9
 *         description: Optional dharamshala id to filter posts.
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
 *         description: Cursor returned from previous API call.
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