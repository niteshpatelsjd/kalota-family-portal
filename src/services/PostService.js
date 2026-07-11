const mongoose = require("mongoose");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const PostComment = require("../models/PostComment");
const PostView = require("../models/PostView");
const PostShare = require("../models/PostShare");
const User = require("../models/User");
const UserFollow = require("../models/UserFollow");
const buildResponse = require("../utils/response");
const DataConstant = require("../constants/DataConstant");
const logger = require("../utils/logger");
const { uploadFile } = require("../utils/FileUtil");
const uploadToCloudinary =
  require(
    "../utils/CloudnaryUploadUtil"
  );


const {
  sendNotificationToUserService,
} = require("./NotificationService");
const visibilityService = require("./UserVisibilityService");
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

function mapPostResponse(post, loggedInUserId = null, ownerSocialMap = {}) {
  const user = post.userId;
  const dharamshala = post.dharamshalaId;
  const ownerSocial =
    user && ownerSocialMap[user._id?.toString()]
      ? ownerSocialMap[user._id.toString()]
      : {};

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
      isPrivate: true,
      followStatus: ownerSocial.followStatus || "NONE",
      followersCount: ownerSocial.followersCount || 0,
      followingCount: ownerSocial.followingCount || 0,
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

function getUserDisplayName(user) {
  if (!user) return "Someone";

  return (
    user.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    "Someone"
  );
}

function getShareKey(postId, sharedByUserId, sharedToUserId = null) {
  if (sharedToUserId) {
    const participantIds = [
      sharedByUserId.toString(),
      sharedToUserId.toString(),
    ].sort();

    return `${postId.toString()}:DIRECT:${participantIds[0]}:${participantIds[1]}`;
  }

  return `${postId.toString()}:USER:${sharedByUserId.toString()}`;
}

async function sendPostCreatedVillageNotifications({ post, creatorId }) {
  try {
    if (!creatorId) return;

    const creator = await User.findById(creatorId)
      .select("name firstName lastName villageId")
      .lean();

    if (!creator?.villageId) {
      logger.warn("Post village notification skipped: creator village missing", {
        postId: post._id,
        creatorId,
      });

      return;
    }

    const users = await User.find({
      _id: { $ne: creatorId },
      villageId: creator.villageId,
      status: 1,
    })
      .select("_id")
      .lean();

    if (!users.length) {
      logger.info("Post village notification skipped: no village users found", {
        postId: post._id,
        creatorId,
        villageId: creator.villageId,
      });

      return;
    }

    const creatorName = getUserDisplayName(creator);
    const postType = post.type === "EVENT" ? "event" : "post";

    const results = await Promise.allSettled(
      users.map((user) =>
        sendNotificationToUserService({
          userId: user._id,
          senderId: creatorId,
          title:
            post.type === "EVENT"
              ? "New event in your village"
              : "New post in your village",
          message: `${creatorName} created a new ${postType}`,
          type: "POST_CREATED",
          data: {
            postId: post._id.toString(),
            createdBy: creatorId.toString(),
            creatorName,
            villageId: creator.villageId.toString(),
            postType: post.type || "POST",
            postTitle: post.title || "",
          },
          imageUrl:
            Array.isArray(post.mediaUrls) && post.mediaUrls.length
              ? post.mediaUrls[0]
              : null,
        })
      )
    );

    const failedCount = results.filter(
      (result) => result.status === "rejected"
    ).length;

    logger.info("Post village notifications processed", {
      postId: post._id,
      creatorId,
      villageId: creator.villageId,
      totalUsers: users.length,
      failedCount,
    });
  } catch (notificationErr) {
    logger.error("Post village notification failed", {
      error: notificationErr.message,
      stack: notificationErr.stack,
      postId: post?._id,
      creatorId,
    });
  }
}

async function getAllowedPostOwnerIds(loggedInUserId) {
  if (!loggedInUserId || !mongoose.Types.ObjectId.isValid(loggedInUserId)) {
    return [];
  }

  const blockedUserIds = await visibilityService.getBlockedUserIds(
    loggedInUserId
  );

  const following = await UserFollow.find({
    followerId: loggedInUserId,
    status: 1,
    ...(blockedUserIds.length
      ? { followingId: { $nin: blockedUserIds } }
      : {}),
  })
    .select("followingId")
    .lean();

  return [
    new mongoose.Types.ObjectId(loggedInUserId),
    ...following.map((item) => item.followingId),
  ];
}

async function validatePostVisible(postId, loggedInUserId) {
  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    return {
      allowed: false,
      response: buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid postId is required",
        null
      ),
    };
  }

  const post = await Post.findOne({
    _id: postId,
    status: 1,
  }).lean();

  if (!post) {
    return {
      allowed: false,
      response: buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Post not found",
        null
      ),
    };
  }

  const visibility = await visibilityService.canViewPost(
    loggedInUserId,
    post.userId
  );

  if (!visibility.canView) {
    return {
      allowed: false,
      response: buildResponse(
        DataConstant.CLIENT_ERROR.FORBIDDEN,
        "You are not allowed to access this post",
        {
          followStatus: visibility.followStatus,
          reason: visibility.reason,
        }
      ),
    };
  }

  return {
    allowed: true,
    post,
  };
}

async function validatePostBlockOnly(postId, loggedInUserId) {
  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    return {
      allowed: false,
      response: buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid postId is required",
        null
      ),
    };
  }

  const post = await Post.findOne({
    _id: postId,
    status: 1,
  }).lean();

  if (!post) {
    return {
      allowed: false,
      response: buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Post not found",
        null
      ),
    };
  }

  if (loggedInUserId) {
    const blockState =
      await visibilityService.getBlockBetween(
        loggedInUserId,
        post.userId
      );

    if (blockState.isBlocked) {
      return {
        allowed: false,
        response: buildResponse(
          DataConstant.CLIENT_ERROR.FORBIDDEN,
          "You are not allowed to access this post",
          {
            followStatus: blockState.blockedByMe
              ? "BLOCKED_BY_ME"
              : "BLOCKED_ME",
            reason: blockState.blockedByMe
              ? "BLOCKED_BY_ME"
              : "BLOCKED_ME",
          }
        ),
      };
    }
  }

  return {
    allowed: true,
    post,
  };
}




async function getViewersService({
  postId,
  viewerId,
  pageIndex = 0,
  pageSize = 20,
}) {
  try {
    logger.info("Starting getViewersService", {
      postId,
      pageIndex,
      pageSize,
    });

    if (!postId) {
      logger.warn("getViewersService: postId is missing");

      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required",
        null
      );
    }

    const skip = pageIndex * pageSize;

    const visiblePost =
      await validatePostBlockOnly(
        postId,
        viewerId
      );

    if (!visiblePost.allowed) {
      return visiblePost.response;
    }

    const blockedUserIds =
      await visibilityService.getBlockedUserIds(
        viewerId
      );

    logger.info("Fetching post viewers", {
      postId,
      skip,
      pageSize,
    });

    const query = {
      postId,
      userId: { $ne: null },
    };

    if (blockedUserIds.length > 0) {
      query.userId = {
        $ne: null,
        $nin: blockedUserIds,
      };
    }

    const [viewers, totalRecords] =
      await Promise.all([
        PostView.find(query)
          .populate({
            path: "userId",
            select:
              "name firstName lastName profileUrl",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),

        PostView.countDocuments(query),
      ]);

    logger.info("Post viewers fetched", {
      viewerCount: viewers.length,
      totalRecords,
    });

    logger.info("Building viewers response");

    const content = viewers.map((item) => ({
      id: item._id,
      viewedAt: item.createdAt,
      user: item.userId
        ? {
            id: item.userId._id,
            name:
              item.userId.name ||
              [
                item.userId.firstName,
                item.userId.lastName,
              ]
                .filter(Boolean)
                .join(" "),
            firstName: item.userId.firstName,
            lastName: item.userId.lastName,
            profileUrl:
              item.userId.profileUrl ||
              item.userId.profileImage,
          }
        : null,
    }));

    logger.info(
      "getViewersService completed successfully",
      {
        responseCount: content.length,
        totalRecords,
        pageIndex,
        pageSize,
      }
    );

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Viewers fetched successfully",
      {
        content,
        pageIndex,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(
          totalRecords / pageSize
        ),
        isLast:
          pageIndex + 1 >=
          Math.ceil(
            totalRecords / pageSize
          ),
        hasNext:
          pageIndex + 1 <
          Math.ceil(
            totalRecords / pageSize
          ),
        hasPrevious: pageIndex > 0,
      }
    );
  } catch (error) {
    logger.error(
      "Error in getViewersService",
      {
        postId,
        pageIndex,
        pageSize,
        message: error.message,
        stack: error.stack,
      }
    );

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE,
      null
    );
  }
}

async function getLikersService({
  postId,
  viewerId,
  pageIndex = 0,
  pageSize = 20,
}) {
  try {
    logger.info("Starting getLikersService", {
      postId,
      pageIndex,
      pageSize,
    });

    if (!postId) {
      logger.warn("getLikersService: postId is missing");

      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required",
        null
      );
    }

    const skip = pageIndex * pageSize;

    const visiblePost =
      await validatePostBlockOnly(
        postId,
        viewerId
      );

    if (!visiblePost.allowed) {
      return visiblePost.response;
    }

    const blockedUserIds =
      await visibilityService.getBlockedUserIds(
        viewerId
      );

    logger.info("Fetching post likers", {
      postId,
      skip,
      pageSize,
    });

    const query = {
      postId,
      status: 1,
    };

    if (blockedUserIds.length > 0) {
      query.userId = {
        $nin: blockedUserIds,
      };
    }

    const [likers, totalRecords] =
      await Promise.all([
        PostLike.find(query)
          .populate({
            path: "userId",
            select:
              "name firstName lastName profileUrl",
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),

        PostLike.countDocuments(query),
      ]);

    logger.info("Post likers fetched", {
      likerCount: likers.length,
      totalRecords,
    });

    logger.info("Building likers response");

    const content = likers.map((item) => ({
      id: item._id,
      likedAt: item.createdAt,
      user: item.userId
        ? {
            id: item.userId._id,
            name:
              item.userId.name ||
              [
                item.userId.firstName,
                item.userId.lastName,
              ]
                .filter(Boolean)
                .join(" "),
            firstName: item.userId.firstName,
            lastName: item.userId.lastName,
            profileUrl:
              item.userId.profileUrl ||
              item.userId.profileImage,
          }
        : null,
    }));

    logger.info(
      "getLikersService completed successfully",
      {
        responseCount: content.length,
        totalRecords,
        pageIndex,
        pageSize,
      }
    );

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Likers fetched successfully",
      {
        content,
        pageIndex,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(
          totalRecords / pageSize
        ),
        isLast:
          pageIndex + 1 >=
          Math.ceil(
            totalRecords / pageSize
          ),
        hasNext:
          pageIndex + 1 <
          Math.ceil(
            totalRecords / pageSize
          ),
        hasPrevious: pageIndex > 0,
      }
    );
  } catch (error) {
    logger.error(
      "Error in getLikersService",
      {
        postId,
        pageIndex,
        pageSize,
        message: error.message,
        stack: error.stack,
      }
    );

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE,
      null
    );
  }
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
        // const uploadedUrl = await uploadFile(file, "posts");
        // if (uploadedUrl) {
        //   mediaUrls.push(uploadedUrl);
        // }
        const uploaded =
            await uploadToCloudinary(
              file.path,
              "kalota/posts"
            );

          if (uploaded?.url) {
            mediaUrls.push(uploaded.url);
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

    await sendPostCreatedVillageNotifications({
      post,
      creatorId: loggedInUserId,
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



function parseRemoveMediaUrls(removeMediaUrls) {
  if (!removeMediaUrls) return [];

  if (Array.isArray(removeMediaUrls)) {
    return removeMediaUrls;
  }

  if (typeof removeMediaUrls === "string") {
    try {
      const parsed = JSON.parse(removeMediaUrls);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      return [parsed];
    } catch (error) {
      return removeMediaUrls
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);
    }
  }

  return [];
}

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

    const urlsToRemove = parseRemoveMediaUrls(removeMediaUrls);

    if (urlsToRemove.length > 0) {
      logger.info(
        `Removing media urls: ${JSON.stringify(urlsToRemove)}`
      );

      currentMediaUrls = currentMediaUrls.filter(
        (url) => !urlsToRemove.includes(url)
      );
    }

    if (files && files.length > 0) {
      logger.info(`Uploading new media files: ${files.length}`);

      for (const file of files) {
        const uploaded =
                await uploadToCloudinary(
                  file.path,
                  "kalota/posts"
                );

              if (uploaded?.url) {
                currentMediaUrls.push(uploaded.url);
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
      await session.abortTransaction();

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

// async function getFeedService(query) {
//   try {
//     const limit = Number(query.limit) || 10;

//     const filter = {
//       status: 1,
//     };

//     // viewer userId only for isLiked check
//     const loggedInUserId = query.userId || null;

//     // targetUserId only for profile feed filter
//     const targetUserId = query.targetUserId || null;

//     if (targetUserId) {
//       filter.userId = targetUserId;
//     }

//     if (query.dharamshalaId) {
//       filter.dharamshalaId = query.dharamshalaId;
//     }

//     if (query.cursor) {
//       filter.createdAt = {
//         $lt: new Date(query.cursor),
//       };
//     }

//     const posts = await Post.find(filter)
//       .sort({ createdAt: -1 })
//       .limit(limit + 1)
//       .populate({
//         path: "userId",
//         select: "name profileUrl districtId villageId",
//         populate: [
//           {
//             path: "districtId",
//             select: "name",
//           },
//           {
//             path: "villageId",
//             select: "name",
//           },
//         ],
//       })
//       .populate({
//         path: "dharamshalaId",
//         select: "name bannerImage address type",
//       })
//       .lean();

//     const hasNextPage = posts.length > limit;

//     const finalPosts = hasNextPage
//       ? posts.slice(0, limit)
//       : posts;

//     const postIds = finalPosts.map((p) => p._id);

//     // Fetch latest viewers for all posts
//     const latestViews = await PostView.find({
//       postId: { $in: postIds },
//       status: 1,
//     })
//       .sort({ createdAt: -1 })
//       .populate({
//         path: "userId",
//         select: "name profileUrl",
//       })
//       .lean();

//     let likedPostIds = [];

//     if (loggedInUserId && postIds.length > 0) {
//       const likes = await PostLike.find({
//         postId: { $in: postIds },
//         userId: loggedInUserId,
//         status: 1,
//       }).select("postId");

//       likedPostIds = likes.map((l) =>
//         l.postId.toString()
//       );
//     }

//     const content = finalPosts.map((post) => {
//       post.isLiked = likedPostIds.includes(
//         post._id.toString()
//       );

//       return mapPostResponse(post, loggedInUserId);
//     });

//     const nextCursor =
//       finalPosts.length > 0
//         ? finalPosts[finalPosts.length - 1].createdAt
//         : null;

//     return buildResponse(
//       DataConstant.SUCCESS.OK,
//       "Posts fetched successfully",
//       {
//         content,
//         nextCursor,
//         hasNextPage,
//       }
//     );
//   } catch (error) {
//     logger.error("getFeedService error", error);

//     return buildResponse(
//       DataConstant.SERVER_ERROR.SERVER_ERROR,
//       "Something went wrong"
//     );
//   }
// }
async function getFeedService(query) {
  try {
    logger.info("getFeedService started");
    logger.info(`getFeedService query: ${JSON.stringify(query)}`);

    const limit = Number(query.limit) || 10;

    const filter = { status: 1 };

    const loggedInUserId = query.userId || null;
    const targetUserId = query.targetUserId || null;
    const blockedByMeUserIds =
      await visibilityService.getBlockedByMeUserIds(
        loggedInUserId
      );

    if (targetUserId) {
      filter.userId = targetUserId;
    } else {
      filter.userId = blockedByMeUserIds.length
        ? { $nin: blockedByMeUserIds }
        : { $ne: null };
    }

    if (
      targetUserId &&
      blockedByMeUserIds.some(
        (blockedUserId) =>
          blockedUserId.toString() ===
          targetUserId.toString()
      )
    ) {
      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Posts fetched successfully",
        {
          content: [],
          nextCursor: null,
          hasNextPage: false,
        }
      );
    }

    if (query.dharamshalaId) filter.dharamshalaId = query.dharamshalaId;

    if (query.cursor) {
      filter.createdAt = { $lt: new Date(query.cursor) };
    }

    logger.info(`post filter: ${JSON.stringify(filter)}`);

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate({
        path: "userId",
        select: "name profileUrl districtId villageId",
        populate: [
          { path: "districtId", select: "name" },
          { path: "villageId", select: "name" },
        ],
      })
      .populate({
        path: "dharamshalaId",
        select: "name bannerImage address type",
      })
      .lean();

    const hasNextPage = posts.length > limit;
    const finalPosts = hasNextPage ? posts.slice(0, limit) : posts;
    const postIds = finalPosts.map((p) => p._id);
    const blockedViewerIds =
      blockedByMeUserIds;

    logger.info(`finalPosts count: ${finalPosts.length}`);
    logger.info(`postIds: ${postIds.map((id) => id.toString()).join(", ")}`);

    let latestViewersMap = {};

    if (postIds.length > 0) {
      logger.info("Fetching latest viewers started");

      const latestViews = await PostView.aggregate([
        {
          $match: {
            postId: { $in: postIds },
            userId: blockedViewerIds.length
              ? {
                  $ne: null,
                  $nin: blockedViewerIds,
                }
              : { $ne: null },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$postId",
            viewers: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            viewers: { $slice: ["$viewers", 3] },
          },
        },
      ]);

      logger.info(`latestViews aggregate count: ${latestViews.length}`);
      logger.info(`latestViews raw: ${JSON.stringify(latestViews)}`);

      const viewerUserIds = [
        ...new Set(
          latestViews
            .flatMap((item) => item.viewers || [])
            .map((view) => view.userId?.toString())
            .filter(Boolean)
        ),
      ];

      logger.info(`viewerUserIds: ${JSON.stringify(viewerUserIds)}`);

      const users = await User.find({
        _id: { $in: viewerUserIds },
      })
        .select("_id name profileUrl")
        .lean();

      logger.info(`viewer users found count: ${users.length}`);
      logger.info(`viewer users found: ${JSON.stringify(users)}`);

      const usersMap = users.reduce((result, user) => {
        result[user._id.toString()] = user;
        return result;
      }, {});

      latestViewersMap = latestViews.reduce((result, item) => {
        const postId = item._id.toString();

        result[postId] = (item.viewers || [])
          .map((view) => {
            const user = usersMap[view.userId?.toString()];

            if (!user) {
              logger.warn(
                `Viewer user not found. postId: ${postId}, userId: ${view.userId}`
              );
              return null;
            }

            return {
              id: user._id,
              name: user.name,
              profileUrl: user.profileUrl,
            };
          })
          .filter(Boolean);

        logger.info(
          `latest viewers for post ${postId}: ${JSON.stringify(result[postId])}`
        );

        return result;
      }, {});
    }

    let likedPostIds = [];
    let ownerSocialMap = {};

    if (loggedInUserId && postIds.length > 0) {
      const likes = await PostLike.find({
        postId: { $in: postIds },
        userId: loggedInUserId,
        status: 1,
      }).select("postId");

      likedPostIds = likes.map((l) => l.postId.toString());

      logger.info(`likedPostIds: ${JSON.stringify(likedPostIds)}`);
    }

    if (finalPosts.length > 0) {
      const ownerIds = [
        ...new Set(
          finalPosts
            .map((post) => post.userId?._id?.toString())
            .filter(Boolean)
        ),
      ];

      const ownerSocialEntries = await Promise.all(
        ownerIds.map(async (ownerId) => {
          const [followStatus, counts] =
            await Promise.all([
              visibilityService.getFollowStatus(
                loggedInUserId,
                ownerId
              ),
              visibilityService.getFollowCounts(
                ownerId
              ),
            ]);

          return [
            ownerId,
            {
              followStatus,
              ...counts,
            },
          ];
        })
      );

      ownerSocialMap =
        Object.fromEntries(ownerSocialEntries);
    }

    const content = finalPosts.map((post) => {
      const postId = post._id.toString();

      post.isLiked = likedPostIds.includes(postId);

      const response = mapPostResponse(
        post,
        loggedInUserId,
        ownerSocialMap
      );

      response.latestViewers = latestViewersMap[postId] || [];

      logger.info(
        `final response postId: ${postId}, latestViewers count: ${response.latestViewers.length}`
      );

      return response;
    });

    const nextCursor =
      finalPosts.length > 0 ? finalPosts[finalPosts.length - 1].createdAt : null;

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
    logger.error(`getFeedService error: ${error.message}`);
    logger.error(error.stack);

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong"
    );
  }
}
/* ───────────────── LIKE / UNLIKE ───────────────── */

async function likeUnlikePostService(body, loggedInUserId) {
  const session = await mongoose.startSession();

  let shouldSendNotification = false;
  let postOwnerId = null;
  let postTitle = "";
  let likerName = "Someone";

  try {
    session.startTransaction();

    const { postId } = body;

    if (!postId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    if (!loggedInUserId) {
      await session.abortTransaction();

      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "userId is required"
      );
    }

    const visiblePost =
      await validatePostBlockOnly(
        postId,
        loggedInUserId
      );

    if (!visiblePost.allowed) {
      await session.abortTransaction();

      return visiblePost.response;
    }

    const post = await Post.findOne({
      _id: postId,
      status: 1,
    }).session(session);

    postOwnerId = post.userId;
    postTitle = post.title;

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
      shouldSendNotification = true;
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
      shouldSendNotification = true;
    }

    await session.commitTransaction();

    if (
      shouldSendNotification &&
      postOwnerId &&
      postOwnerId.toString() !== loggedInUserId.toString()
    ) {
      try {
        const liker = await User.findById(loggedInUserId).select(
          "name firstName lastName"
        );

        if (liker) {
          likerName =
            liker.name ||
            `${liker.firstName || ""} ${liker.lastName || ""}`.trim() ||
            "Someone";
        }

        await sendNotificationToUserService({
          userId: postOwnerId,
          senderId: loggedInUserId,
          title: "New like on your post",
          message: `${likerName} liked your post`,
          type: "LIKE",
          data: {
            postId: postId.toString(),
            likedBy: loggedInUserId.toString(),
            postTitle: postTitle || "",
          },
        });
      } catch (notificationErr) {
        logger.error(
          `Like notification failed: ${notificationErr.message}`,
          notificationErr
        );
      }
    }

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

    const visiblePost =
      await validatePostBlockOnly(
        postId,
        loggedInUserId
      );

    if (!visiblePost.allowed) {
      return visiblePost.response;
    }

    const post = visiblePost.post;

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

    if (
      post?.userId &&
      loggedInUserId &&
      post.userId.toString() !== loggedInUserId.toString()
    ) {
      try {
        const commenter = await User.findById(loggedInUserId)
          .select("name firstName lastName")
          .lean();
        const commenterName = getUserDisplayName(commenter);

        await sendNotificationToUserService({
          userId: post.userId,
          senderId: loggedInUserId,
          title: "New comment on your post",
          message: `${commenterName} commented on your post`,
          type: "COMMENT",
          data: {
            postId: postId.toString(),
            commentId: newComment._id.toString(),
            commentedBy: loggedInUserId.toString(),
            postTitle: post.title || "",
            comment: String(comment || "").slice(0, 120),
          },
        });
      } catch (notificationErr) {
        logger.error(
          `Comment notification failed: ${notificationErr.message}`,
          notificationErr
        );
      }
    }

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
    const viewerId =
      query.viewerId || query.userId || null;

    if (!postId) {
      logger.warn(
        "getCommentsService: postId is required"
      );

      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    const visiblePost =
      await validatePostBlockOnly(
        postId,
        viewerId
      );

    if (!visiblePost.allowed) {
      return visiblePost.response;
    }

    const blockedUserIds =
      await visibilityService.getBlockedUserIds(
        viewerId
      );

    const filter = {
      postId,
      status: 1,
      parentCommentId: null,
    };

    if (blockedUserIds.length > 0) {
      filter.userId = {
        $nin: blockedUserIds,
      };
    }

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

    const visiblePost =
      await validatePostVisible(
        postId,
        loggedInUserId
      );

    if (!visiblePost.allowed) {
      return visiblePost.response;
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

async function sharePostService(body, loggedInUserId) {
  try {
    const {
      postId,
      sharedToUserId,
      toUserId,
      receiverUserId,
    } = body;
    const targetUserId =
      sharedToUserId || toUserId || receiverUserId || null;

    if (!postId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "postId is required"
      );
    }

    if (!loggedInUserId) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "userId is required"
      );
    }

    if (
      targetUserId &&
      !mongoose.Types.ObjectId.isValid(targetUserId)
    ) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid sharedToUserId is required"
      );
    }

    const visiblePost =
      await validatePostBlockOnly(
        postId,
        loggedInUserId
      );

    if (!visiblePost.allowed) {
      return visiblePost.response;
    }

    if (
      targetUserId &&
      targetUserId.toString() === loggedInUserId.toString()
    ) {
      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Post share already counted",
        {
          isNewShare: false,
          shareCountIncreased: false,
        }
      );
    }

    if (targetUserId) {
      const targetUser = await User.findOne({
        _id: targetUserId,
        status: 1,
      }).select("_id");

      if (!targetUser) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.NOT_FOUND,
          "Shared user not found"
        );
      }

      const blockState =
        await visibilityService.getBlockBetween(
          loggedInUserId,
          targetUserId
        );

      if (blockState.isBlocked) {
        return buildResponse(
          DataConstant.CLIENT_ERROR.FORBIDDEN,
          "You are not allowed to share with this user",
          {
            reason: blockState.blockedByMe
              ? "BLOCKED_BY_ME"
              : "BLOCKED_ME",
          }
        );
      }
    }

    const shareKey = getShareKey(
      postId,
      loggedInUserId,
      targetUserId
    );
    let isNewShare = false;

    try {
      await PostShare.create({
        postId,
        sharedByUserId: loggedInUserId,
        sharedToUserId: targetUserId,
        shareKey,
      });

      isNewShare = true;
    } catch (shareErr) {
      if (shareErr?.code !== 11000) {
        throw shareErr;
      }
    }

    if (isNewShare) {
      await Post.updateOne(
        { _id: postId },
        { $inc: { shareCount: 1 } }
      );
    }

    return buildResponse(
      DataConstant.SUCCESS.OK,
      isNewShare
        ? "Post shared successfully"
        : "Post share already counted",
      {
        isNewShare,
        shareCountIncreased: isNewShare,
      }
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
  getLikersService,
  getViewersService,
};
