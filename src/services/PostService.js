const mongoose = require("mongoose");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const PostComment = require("../models/PostComment");
const PostView = require("../models/PostView");

const buildResponse = require("../utils/response");
const DataConstant = require("../constants/DataConstant");
const logger = require("../utils/logger");
const { uploadFile } = require("../utils/FileUtil");

/* ───────────────── HELPERS ───────────────── */

function parseEventDate(dateStr) {
  if (!dateStr) return null;

  // dd-MM-yyyy hh:mm:ss
  const [datePart, timePart = "00:00:00"] = dateStr.split(" ");
  const [day, month, year] = datePart.split("-");
  const [hour, minute, second] = timePart.split(":");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

function formatDate(date) {
  if (!date) return null;

  const d = new Date(date);

  const pad = (n) => String(n).padStart(2, "0");

  return `${pad(d.getDate())}-${pad(
    d.getMonth() + 1
  )}-${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

function mapPostResponse(post, loggedInUserId = null) {
  const user = post.userId;
  const dharamshala = post.dharamshalaId;

  return {
    id: post._id,
    title: post.title,
    description: post.description,
    mediaUrls: post.mediaUrls || [],
    type: post.type,
    eventDate: formatDate(post.eventDate),

userResponse: user
  ? {
      id: user._id,
      name: user.name,
      profileUrl: user.profileUrl || null,
      villageName: user.villageId?.name || "",
      districtName: user.districtId?.name || "",
    }
  : null,

    dharamshalaResponse: dharamshala
      ? {
          id: dharamshala._id,
          name: dharamshala.name,
          bannerImage: dharamshala.bannerImage || null,
          location: dharamshala.address || "",
          type: dharamshala.type || "",
        }
      : null,

    likeCount: post.likeCount || 0,
    commentCount: post.commentCount || 0,
    shareCount: post.shareCount || 0,
    viewCount: post.viewCount || 0,

    isLiked: post.isLiked || false,

    createdAt: formatDate(post.createdAt),
  };
}

/* ───────────────── CREATE POST ───────────────── */

async function createPostService(body, files, loggedInUserId) {
  try {
    logger.info("Starting createPostService");

    const {
      title,
      description,
      type,
      eventDate,
      dharamshalaId,
    } = body;

    if (!title) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "title is required"
      );
    }

    if (!description) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "description is required"
      );
    }

    const mediaUrls = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const uploadedUrl = await uploadFile(file, "posts");

        if (uploadedUrl) {
          mediaUrls.push(uploadedUrl);
        }
      }
    }

    const post = await Post.create({
      title,
      description,
      mediaUrls,
      userId: loggedInUserId,
      dharamshalaId: dharamshalaId || null,
      type: type || "POST",
      eventDate:
        type === "EVENT"
          ? parseEventDate(eventDate)
          : null,
    });

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Post created successfully",
      post
    );
  } catch (error) {
    logger.error("createPostService error", error);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}

/* ───────────────── EDIT POST ───────────────── */

async function editPostService(body, files, loggedInUserId) {
  try {
    logger.info(
      `Starting editPostService with body: ${JSON.stringify(body)}`
    );

    const {
      postId,
      title,
      description,
      type,
      eventDate,
      dharamshalaId,
      removeMediaUrls,
    } = body;

    if (!postId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    const post = await Post.findOne({
      _id: postId,
      status: 1,
    });

    if (!post) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Post not found"
      );
    }

    if (title !== undefined) {
      post.title = title;
    }

    if (description !== undefined) {
      post.description = description;
    }

    if (type !== undefined) {
      post.type = type;
    }

    if (type === "EVENT") {
      post.eventDate = eventDate
        ? parseEventDate(eventDate)
        : post.eventDate;
    }

    if (type === "POST") {
      post.eventDate = null;
    }

    if (dharamshalaId !== undefined) {
      post.dharamshalaId = dharamshalaId || null;
    }

    let currentMediaUrls = post.mediaUrls || [];

    if (removeMediaUrls) {
      const urlsToRemove = Array.isArray(removeMediaUrls)
        ? removeMediaUrls
        : JSON.parse(removeMediaUrls);

      currentMediaUrls = currentMediaUrls.filter(
        (url) => !urlsToRemove.includes(url)
      );
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const uploadedUrl = await uploadFile(file, "posts");

        if (uploadedUrl) {
          currentMediaUrls.push(uploadedUrl);
        }
      }
    }

    post.mediaUrls = currentMediaUrls;
   
    await post.save();

    logger.info(`Post updated successfully: ${postId}`);

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Post updated successfully",
      post
    );
  } catch (error) {
    logger.error(
      `editPostService error: ${error.message}`,
      error
    );

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}

/* ───────────────── DELETE POST ───────────────── */

async function deletePostService(body, loggedInUserId) {
  try {
    logger.info(
      `Starting deletePostService with body: ${JSON.stringify(body)}`
    );

    const { postId } = body;

    if (!postId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    const post = await Post.findOne({
      _id: postId,
      status: 1,
    });

    if (!post) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Post not found"
      );
    }

    post.status = 0;
    
    await post.save();

    logger.info(`Post deleted successfully: ${postId}`);

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Post deleted successfully"
    );
  } catch (error) {
    logger.error(
      `deletePostService error: ${error.message}`,
      error
    );

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}

/* ───────────────── GET FEED ───────────────── */

async function getFeedService(query) {
  try {
    const limit = Number(query.limit) || 10;

    const filter = {
      status: 1,
    };

    const loggedInUserId = query.userId;

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.dharamshalaId) {
      filter.dharamshalaId = query.dharamshalaId;
    }

    if (query.cursor) {
      filter.createdAt = {
        $lt: new Date(query.cursor),
      };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate({
        path: "userId",
        select: "name profileUrl districtId villageId",
        populate: [
          {
            path: "districtId",
            select: "name",
          },
          {
            path: "villageId",
            select: "name",
          },
        ],
      })
      .populate({
        path: "dharamshalaId",
        select: "name bannerImage address type",
      })
      .lean();

    const hasNextPage = posts.length > limit;

    const finalPosts = hasNextPage
      ? posts.slice(0, limit)
      : posts;

    const postIds = finalPosts.map((p) => p._id);

    let likedPostIds = [];

    if (loggedInUserId && postIds.length > 0) {
      const likes = await PostLike.find({
        postId: { $in: postIds },
        userId: loggedInUserId,
        status: 1,
      }).select("postId");

      likedPostIds = likes.map((l) =>
        l.postId.toString()
      );
    }

    const content = finalPosts.map((post) => {
      post.isLiked = likedPostIds.includes(
        post._id.toString()
      );

      return mapPostResponse(post, loggedInUserId);
    });

    const nextCursor =
      content.length > 0
        ? finalPosts[finalPosts.length - 1].createdAt
        : null;

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Posts fetched successfully",
      {
        content,
        nextCursor,
        hasNextPage,
      }
    );
  } catch (error) {
    logger.error("getFeedService error", error);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}
/* ───────────────── LIKE / UNLIKE ───────────────── */

async function likeUnlikePostService(body, loggedInUserId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { postId } = body;

    if (!postId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    const existingLike = await PostLike.findOne({
      postId,
      userId: loggedInUserId,
    }).session(session);

    let isLiked = false;

    if (existingLike && existingLike.status === 1) {
      existingLike.status = 0;
      await existingLike.save({ session });

      await Post.updateOne(
        { _id: postId },
        { $inc: { likeCount: -1 } },
        { session }
      );

      isLiked = false;
    } else if (existingLike) {
      existingLike.status = 1;
      await existingLike.save({ session });

      await Post.updateOne(
        { _id: postId },
        { $inc: { likeCount: 1 } },
        { session }
      );

      isLiked = true;
    } else {
      await PostLike.create(
        [
          {
            postId,
            userId: loggedInUserId,
          },
        ],
        { session }
      );

      await Post.updateOne(
        { _id: postId },
        { $inc: { likeCount: 1 } },
        { session }
      );

      isLiked = true;
    }

    await session.commitTransaction();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      isLiked
        ? "Post liked successfully"
        : "Post unliked successfully",
      { isLiked }
    );
  } catch (error) {
    await session.abortTransaction();

    logger.error("likeUnlikePostService error", error);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  } finally {
    session.endSession();
  }
}

/* ───────────────── ADD COMMENT ───────────────── */

async function addCommentService(body, loggedInUserId) {
  try {
    const { postId, comment, parentCommentId } = body;

    if (!postId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    if (!comment) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "comment is required"
      );
    }

    const newComment = await PostComment.create({
      postId,
      userId: loggedInUserId,
      comment,
      parentCommentId: parentCommentId || null,
    });

    await Post.updateOne(
      { _id: postId },
      { $inc: { commentCount: 1 } }
    );

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Comment added successfully",
      newComment
    );
  } catch (error) {
    logger.error("addCommentService error", error);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}

/* ───────────────── GET COMMENTS ───────────────── */

async function getCommentsService(query) {
  try {
    logger.info(
      `Starting getCommentsService with query: ${JSON.stringify(
        query
      )}`
    );

    const { postId } = query;

    const limit = Number(query.limit) || 20;
    const cursor = query.cursor;

    if (!postId) {
      logger.warn(
        "getCommentsService: postId is required"
      );

      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    const filter = {
      postId,
      status: 1,
      parentCommentId: null,
    };

    if (cursor) {
      filter.createdAt = {
        $lt: new Date(cursor),
      };
    }

    logger.info(
      `Comment filter: ${JSON.stringify(filter)}`
    );

    const comments = await PostComment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate({
        path: "userId",
        select:
          "name profileUrl districtId villageId",
        populate: [
          {
            path: "districtId",
            select: "name",
          },
          {
            path: "villageId",
            select: "name",
          },
        ],
      })
      .lean();

    logger.info(
      `Total comments fetched from DB: ${comments.length}`
    );

    const hasNextPage =
      comments.length > limit;

    const finalComments = hasNextPage
      ? comments.slice(0, limit)
      : comments;

    logger.info(
      `Final comments count after pagination: ${finalComments.length}`
    );

    const content = finalComments.map(
      (item) => ({
        id: item._id,
        comment: item.comment,

        userResponse: item.userId
          ? {
              id: item.userId._id,
              name: item.userId.name,
              profileUrl:
                item.userId.profileUrl || null,
              villageName:
                item.userId.villageId?.name ||
                "",
              districtName:
                item.userId.districtId?.name ||
                "",
            }
          : null,

        createdAt: formatDate(
          item.createdAt
        ),
      })
    );

    logger.info(
      `Mapped comments count: ${content.length}`
    );

    const nextCursor =
      finalComments.length > 0
        ? finalComments[
            finalComments.length - 1
          ].createdAt
        : null;

    logger.info(
      `Next Cursor: ${nextCursor}`
    );

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Comments fetched successfully",
      {
        content,
        nextCursor,
        hasNextPage,
      }
    );
  } catch (error) {
    logger.error(
      `getCommentsService error: ${error.message}`,
      error
    );

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}

/* ───────────────── VIEW POST ───────────────── */

async function viewPostService(body, loggedInUserId) {
  try {
    const { postId, deviceId } = body;

    if (!postId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    const filter = {
      postId,
    };

    if (loggedInUserId) {
      filter.userId = loggedInUserId;
    } else if (deviceId) {
      filter.deviceId = deviceId;
    }

    const existingView = await PostView.findOne(filter);

    if (!existingView) {
      await PostView.create({
        postId,
        userId: loggedInUserId || null,
        deviceId: deviceId || null,
      });

      await Post.updateOne(
        { _id: postId },
        { $inc: { viewCount: 1 } }
      );
    }

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Post viewed successfully"
    );
  } catch (error) {
    logger.error("viewPostService error", error);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}

/* ───────────────── SHARE POST ───────────────── */

async function sharePostService(body) {
  try {
    const { postId } = body;

    if (!postId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    await Post.updateOne(
      { _id: postId },
      { $inc: { shareCount: 1 } }
    );

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Post shared successfully"
    );
  } catch (error) {
    logger.error("sharePostService error", error);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}

module.exports = {
  createPostService,
  getFeedService,
  likeUnlikePostService,
  addCommentService,
  getCommentsService,
  viewPostService,
  sharePostService,
  editPostService,
  deletePostService,
};