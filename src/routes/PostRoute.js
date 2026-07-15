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
  deletePost,
  getAllPost,
  blockUnblockPost,
  reportPost,
  getAllReport,
  blockUnblockReport,
  openCloseReport
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
 *     description: Returns viewers for a post. This API does not require follow/private-profile access; it only blocks access or filters users based on block relationships.
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: viewerId
 *         required: false
 *         schema:
 *           type: string
 *         description: Logged-in user id used for block filtering
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
 *     description: Returns users who liked a post. This API does not require follow/private-profile access; it only blocks access or filters users based on block relationships.
 *     parameters:
 *       - in: query
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: viewerId
 *         required: false
 *         schema:
 *           type: string
 *         description: Logged-in user id used for block filtering
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
 *     summary: Get home post feed with cursor pagination
 *     description: Returns active posts without follow/private-profile filtering. If userId is passed, posts from users blocked by this logged-in user are hidden. Each post owner response includes followStatus, followersCount and followingCount for home screen badges.
 *     tags: [Post]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         example: 6853ac3e6c6f4e00123abcd1
 *         description: Logged-in user id. Used for isLiked calculation and hiding posts from users blocked by this user.
 *
 *       - in: query
 *         name: targetUserId
 *         required: false
 *         schema:
 *           type: string
 *         example: 6853ac3e6c6f4e00123abcd2
 *         description: Optional profile user id. Use this only when fetching a specific user's posts. If this user is blocked by logged-in userId, empty feed is returned.
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
 * /admin/post/getAllPost:
 *   get:
 *     summary: Get all posts/events for admin listing
 *     tags: [Post]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional post owner user id
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           example: 01-07-2026
 *         description: Filter from created date, format dd-MM-yyyy
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           example: 15-07-2026
 *         description: Filter to created date, format dd-MM-yyyy
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [POST, EVENT]
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Search by title, description, user name or mobile number
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *         description: 0 deleted, 1 active, 2 blocked
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
 *     responses:
 *       200:
 *         description: Posts fetched successfully
 */
router.get(
  "/getAllPost",
  getAllPost
);

/**
 * @swagger
 * /admin/post/blockUnblock:
 *   post:
 *     summary: Block/unblock/delete post
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               status:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: 0 deleted, 1 active, 2 blocked
 *                 example: 2
 *     responses:
 *       200:
 *         description: Post status updated successfully
 */
router.post(
  "/blockUnblock",
  blockUnblockPost
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
 *     description: Returns top-level comments with child replies for a post. This API does not require follow/private-profile access; it only blocks access or filters users based on block relationships.
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
 *         name: viewerId
 *         schema:
 *           type: string
 *           example: 6853ac3e6c6f4e00123abcd1
 *         description: Logged-in user id used for block filtering
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
 *     summary: Share post and increase count only once per unique share pair
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
 *               sharedToUserId:
 *                 type: string
 *                 description: Optional user id receiving the shared post. A->B and B->A are counted once for the same post. Self-share does not increase count.
 *                 example: 6853ac3e6c6f4e00123abce1
 *     responses:
 *       200:
 *         description: Post shared successfully or already counted
 */
router.post(
  "/sharePost",
  
  sharePost
);

/**
 * @swagger
 * /admin/post/reportPost:
 *   post:
 *     summary: Report a post or comment
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedId
 *               - issueType
 *               - userId
 *               - feedType
 *             properties:
 *               feedId:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               issueType:
 *                 type: string
 *                 example: SPAM
 *               descriptions:
 *                 type: string
 *                 example: This content is inappropriate.
 *               userId:
 *                 type: string
 *                 description: User who reported the post/comment
 *                 example: 6853ac3e6c6f4e00123abcd1
 *               feedType:
 *                 type: string
 *                 enum: [Post, Comment]
 *                 example: Post
 *               status:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 default: 1
 *               reportStatus:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: 1 Pending, 2 Open, 3 Closed
 *                 default: 1
 *     responses:
 *       200:
 *         description: Report submitted successfully
 */
router.post(
  "/reportPost",
  reportPost
);

/**
 * @swagger
 * /admin/post/getAllReport:
 *   get:
 *     summary: Get all post/comment reports
 *     tags: [Post]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional reporting user id
 *       - in: query
 *         name: feedId
 *         schema:
 *           type: string
 *       - in: query
 *         name: feedType
 *         schema:
 *           type: string
 *           enum: [Post, Comment]
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2]
 *       - in: query
 *         name: reportStatus
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *         description: 1 Pending, 2 Open, 3 Closed
 *       - in: query
 *         name: searchText
 *         schema:
 *           type: string
 *         description: Search by issue type or description
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
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 */
router.get(
  "/getAllReport",
  getAllReport
);

/**
 * @swagger
 * /admin/post/blockUnblockReport:
 *   post:
 *     summary: Block/unblock/delete report
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *             properties:
 *               id:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               status:
 *                 type: integer
 *                 enum: [0, 1, 2]
 *                 description: 0 deleted, 1 active, 2 blocked
 *                 example: 2
 *     responses:
 *       200:
 *         description: Report status updated successfully
 */
router.post(
  "/blockUnblockReport",
  blockUnblockReport
);

/**
 * @swagger
 * /admin/post/openCloseReport:
 *   post:
 *     summary: Mark report as pending, open, or closed
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - reportStatus
 *             properties:
 *               id:
 *                 type: string
 *                 example: 6853ac3e6c6f4e00123abcd9
 *               reportStatus:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: 1 Pending, 2 Open, 3 Closed
 *                 example: 3
 *     responses:
 *       200:
 *         description: Report workflow status updated successfully
 */
router.post(
  "/openCloseReport",
  openCloseReport
);

module.exports = router;
