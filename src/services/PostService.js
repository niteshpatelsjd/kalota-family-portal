const mongoose = require("mongoose");
const Post = require("../models/Post");
const PostLike = require("../models/PostLike");
const PostComment = require("../models/PostComment");
const PostView = require("../models/PostView");
const PostShare = require("../models/PostShare");
const ReportSpam = require("../models/ReportSpam");
const User = require("../models/User");
const UserFollow = require("../models/UserFollow");
const UserFollowRequest = require("../models/UserFollowRequest");
const UserBlock = require("../models/UserBlock");
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

function isVideoMediaUrl(url = "") {
  return /\.(mp4|m4v|mov|webm|mkv)(?:$|[?#])/i.test(url);
}

function buildCloudinaryImageThumbnailUrl(url = "") {
  if (!url.includes("/image/upload/")) return url;

  return url.replace(
    "/image/upload/",
    "/image/upload/w_900,q_auto:good,f_auto/"
  );
}

function buildCloudinaryVideoPosterUrl(url = "") {
  if (!url.includes("/video/upload/")) return "";

  const withoutQuery = url.split("?")[0] || url;
  const posterUrl = withoutQuery.replace(
    /\/video\/upload\/(.*)\/([^/.]+)\.(mp4|m4v|mov|webm|mkv)$/i,
    "/video/upload/so_0,w_900,q_auto:good,f_jpg/$1/$2.jpg"
  );

  return posterUrl === withoutQuery ? "" : posterUrl;
}

function normalizeMediaType(uploaded = {}, url = "") {
  if (uploaded.resourceType === "video" || isVideoMediaUrl(url)) {
    return "VIDEO";
  }

  if (uploaded.resourceType === "image" || url.includes("/image/upload/")) {
    return "IMAGE";
  }

  return "OTHER";
}

function buildMediaItemFromUpload(uploaded) {
  const url = uploaded?.url || "";
  const mediaType = normalizeMediaType(uploaded, url);
  const posterUrl = mediaType === "VIDEO" ? buildCloudinaryVideoPosterUrl(url) : "";
  const thumbnailUrl =
    mediaType === "IMAGE" ? buildCloudinaryImageThumbnailUrl(url) : posterUrl;

  return {
    url,
    thumbnailUrl,
    posterUrl,
    mediaType,
    width: uploaded?.width || null,
    height: uploaded?.height || null,
    duration: uploaded?.duration || null,
    publicId: uploaded?.publicId || "",
    format: uploaded?.format || "",
  };
}

function buildLegacyMediaItem(url) {
  const mediaType = normalizeMediaType({}, url);
  const posterUrl = mediaType === "VIDEO" ? buildCloudinaryVideoPosterUrl(url) : "";
  const thumbnailUrl =
    mediaType === "IMAGE" ? buildCloudinaryImageThumbnailUrl(url) : posterUrl;

  return {
    url,
    thumbnailUrl,
    posterUrl,
    mediaType,
    width: null,
    height: null,
    duration: null,
    publicId: "",
    format: "",
  };
}

function parseDateOnly(dateStr, endOfDay = false) {
  if (!dateStr) return null;

  const [day, month, year] =
    String(dateStr).split("-");

  if (!day || !month || !year) {
    return null;
  }

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
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
    mediaItems:
      Array.isArray(post.mediaItems) && post.mediaItems.length > 0
        ? post.mediaItems
        : (post.mediaUrls || []).map(buildLegacyMediaItem),
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

function toObjectId(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(id);
}

async function buildOwnerSocialMap(ownerIds = [], viewerId = null) {
  const normalizedOwnerIds = [
    ...new Set(ownerIds.map(String).filter(Boolean)),
  ];

  if (normalizedOwnerIds.length === 0) {
    return {};
  }

  const ownerObjectIds = normalizedOwnerIds
    .map((id) => toObjectId(id))
    .filter(Boolean);
  const viewerObjectId = toObjectId(viewerId);

  const [followersCounts, followingCounts] = await Promise.all([
    UserFollow.aggregate([
      {
        $match: {
          followingId: { $in: ownerObjectIds },
          status: 1,
        },
      },
      { $group: { _id: "$followingId", count: { $sum: 1 } } },
    ]),
    UserFollow.aggregate([
      {
        $match: {
          followerId: { $in: ownerObjectIds },
          status: 1,
        },
      },
      { $group: { _id: "$followerId", count: { $sum: 1 } } },
    ]),
  ]);

  const followersCountMap = followersCounts.reduce((result, item) => {
    result[item._id.toString()] = item.count;
    return result;
  }, {});
  const followingCountMap = followingCounts.reduce((result, item) => {
    result[item._id.toString()] = item.count;
    return result;
  }, {});

  let blockByOwnerId = {};
  let followingOwnerIds = new Set();
  let requestedOwnerIds = new Set();
  let pendingApprovalOwnerIds = new Set();

  if (viewerObjectId) {
    const targetOwnerObjectIds = ownerObjectIds.filter(
      (ownerId) => ownerId.toString() !== viewerObjectId.toString()
    );

    const [blocks, follows, sentRequests, incomingRequests] =
      await Promise.all([
        UserBlock.find({
          status: 1,
          $or: [
            { blockerId: viewerObjectId, blockedUserId: { $in: targetOwnerObjectIds } },
            { blockerId: { $in: targetOwnerObjectIds }, blockedUserId: viewerObjectId },
          ],
        })
          .select("blockerId blockedUserId")
          .lean(),
        UserFollow.find({
          followerId: viewerObjectId,
          followingId: { $in: targetOwnerObjectIds },
          status: 1,
        })
          .select("followingId")
          .lean(),
        UserFollowRequest.find({
          requesterId: viewerObjectId,
          targetUserId: { $in: targetOwnerObjectIds },
          status: "PENDING",
        })
          .select("targetUserId")
          .lean(),
        UserFollowRequest.find({
          requesterId: { $in: targetOwnerObjectIds },
          targetUserId: viewerObjectId,
          status: "PENDING",
        })
          .select("requesterId")
          .lean(),
      ]);

    blockByOwnerId = blocks.reduce((result, block) => {
      const blockerId = block.blockerId?.toString();
      const blockedUserId = block.blockedUserId?.toString();
      const viewerIdString = viewerObjectId.toString();
      const ownerId =
        blockerId === viewerIdString ? blockedUserId : blockerId;

      if (ownerId) {
        result[ownerId] =
          blockerId === viewerIdString ? "BLOCKED_BY_ME" : "BLOCKED_ME";
      }

      return result;
    }, {});
    followingOwnerIds = new Set(
      follows.map((follow) => follow.followingId?.toString()).filter(Boolean)
    );
    requestedOwnerIds = new Set(
      sentRequests
        .map((request) => request.targetUserId?.toString())
        .filter(Boolean)
    );
    pendingApprovalOwnerIds = new Set(
      incomingRequests
        .map((request) => request.requesterId?.toString())
        .filter(Boolean)
    );
  }

  return normalizedOwnerIds.reduce((result, ownerId) => {
    let followStatus = "NONE";

    if (viewerObjectId && ownerId === viewerObjectId.toString()) {
      followStatus = "SELF";
    } else if (blockByOwnerId[ownerId]) {
      followStatus = blockByOwnerId[ownerId];
    } else if (followingOwnerIds.has(ownerId)) {
      followStatus = "FOLLOWING";
    } else if (requestedOwnerIds.has(ownerId)) {
      followStatus = "REQUESTED";
    } else if (pendingApprovalOwnerIds.has(ownerId)) {
      followStatus = "PENDING_APPROVAL";
    }

    result[ownerId] = {
      followStatus,
      followersCount: followersCountMap[ownerId] || 0,
      followingCount: followingCountMap[ownerId] || 0,
    };

    return result;
  }, {});
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

function mapReportedByUserResponse(user) {
  if (!user) return null;

  return {
    id: user._id,
    name: getUserDisplayName(user),
    mobileNumber: user.mobileNumber || "",
    profileUrl: user.profileUrl || null,
  };
}

function mapReportFeedResponse(report) {
  const feed = report.feedId;

  if (!feed || !feed._id) {
    return {
      feedResponse: feed || null,
      postResponse: null,
      commentResponse: null,
    };
  }

  if (report.feedType === "Post") {
    const postResponse = {
      id: feed._id,
      title: feed.title || "",
      description: feed.description || "",
      mediaUrls: feed.mediaUrls || [],
      type: feed.type || "POST",
      eventDate: formatDate(feed.eventDate),
      status: feed.status,
      likeCount: feed.likeCount || 0,
      commentCount: feed.commentCount || 0,
      shareCount: feed.shareCount || 0,
      viewCount: feed.viewCount || 0,
      createdAt: formatDate(feed.createdAt),
      updatedAt: formatDate(feed.updatedAt),
    };

    return {
      feedResponse: postResponse,
      postResponse,
      commentResponse: null,
    };
  }

  const commentResponse = {
    id: feed._id,
    postId: feed.postId || null,
    userId: feed.userId || null,
    comment: feed.comment || "",
    parentCommentId: feed.parentCommentId || null,
    status: feed.status,
    createdAt: formatDate(feed.createdAt),
    updatedAt: formatDate(feed.updatedAt),
  };

  return {
    feedResponse: commentResponse,
    postResponse: null,
    commentResponse,
  };
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
    const mediaItems = [];

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
            mediaItems.push(buildMediaItemFromUpload(uploaded));
          }
      }
    }

    const post = await Post.create({
      title,
      description,
      mediaUrls,
      mediaItems,
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
    let currentMediaItems =
      Array.isArray(post.mediaItems) && post.mediaItems.length > 0
        ? post.mediaItems
        : currentMediaUrls.map(buildLegacyMediaItem);

    const urlsToRemove = parseRemoveMediaUrls(removeMediaUrls);

    if (urlsToRemove.length > 0) {
      logger.info(
        `Removing media urls: ${JSON.stringify(urlsToRemove)}`
      );

      currentMediaUrls = currentMediaUrls.filter(
        (url) => !urlsToRemove.includes(url)
      );
      currentMediaItems = currentMediaItems.filter(
        (item) => !urlsToRemove.includes(item.url)
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
                currentMediaItems.push(buildMediaItemFromUpload(uploaded));
              }
      }
    }

    post.mediaUrls = currentMediaUrls;
    post.mediaItems = currentMediaItems;

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

    let latestLikedUsersMap = {};
    let likedPostIds = [];
    let ownerSocialMap = {};

    if (postIds.length > 0) {
      logger.info("Fetching latest liked users started");

      const excludedLikedUserIds = [
        ...blockedViewerIds,
        ...(loggedInUserId &&
        mongoose.Types.ObjectId.isValid(loggedInUserId)
          ? [new mongoose.Types.ObjectId(loggedInUserId)]
          : []),
      ];

      const latestLikes = await PostLike.aggregate([
        {
          $match: {
            postId: { $in: postIds },
            status: 1,
            ...(excludedLikedUserIds.length
              ? {
                  userId: {
                    $nin: excludedLikedUserIds,
                  },
                }
              : {}),
          },
        },
        { $sort: { updatedAt: -1, createdAt: -1 } },
        {
          $group: {
            _id: "$postId",
            likes: { $push: "$$ROOT" },
          },
        },
        {
          $project: {
            likes: { $slice: ["$likes", 3] },
          },
        },
      ]);

      logger.info(`latestLikes aggregate count: ${latestLikes.length}`);

      const likedUserIds = [
        ...new Set(
          latestLikes
            .flatMap((item) => item.likes || [])
            .map((like) => like.userId?.toString())
            .filter(Boolean)
        ),
      ];

      const likedUsers = await User.find({
        _id: { $in: likedUserIds },
      })
        .select("_id name firstName lastName profileUrl")
        .lean();

      const likedUsersMap = likedUsers.reduce((result, user) => {
        result[user._id.toString()] = user;
        return result;
      }, {});

      latestLikedUsersMap = latestLikes.reduce((result, item) => {
        const postId = item._id.toString();

        result[postId] = (item.likes || [])
          .map((like) => {
            const user = likedUsersMap[like.userId?.toString()];

            if (!user) {
              logger.warn(
                `Liked user not found. postId: ${postId}, userId: ${like.userId}`
              );
              return null;
            }

            return {
              id: user._id,
              name: getUserDisplayName(user),
              profileUrl: user.profileUrl || null,
            };
          })
          .filter(Boolean);

        return result;
      }, {});
    }

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

      ownerSocialMap = await buildOwnerSocialMap(ownerIds, loggedInUserId);
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
      response.latestLikedUsers = latestLikedUsersMap[postId] || [];
      response.latestLikedUser =
        response.latestLikedUsers.length > 0
          ? response.latestLikedUsers[0]
          : null;

      logger.info(
        `final response postId: ${postId}, latestViewers count: ${response.latestViewers.length}, latestLikedUsers count: ${response.latestLikedUsers.length}`
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

    const parentCommentIds = finalComments.map(
      (item) => item._id
    );

    const replyFilter = {
      postId,
      status: 1,
      parentCommentId: {
        $in: parentCommentIds,
      },
    };

    if (blockedUserIds.length > 0) {
      replyFilter.userId = {
        $nin: blockedUserIds,
      };
    }

    const replies = parentCommentIds.length
      ? await PostComment.find(replyFilter)
          .sort({ createdAt: 1 })
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
          .lean()
      : [];

    const mapCommentResponse = (item) => ({
      id: item._id,
      comment: item.comment,
      parentCommentId:
        item.parentCommentId || null,

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
    });

    const repliesByParentId = replies.reduce(
      (result, reply) => {
        const parentId =
          reply.parentCommentId?.toString();

        if (!parentId) return result;

        if (!result[parentId]) {
          result[parentId] = [];
        }

        result[parentId].push(
          mapCommentResponse(reply)
        );

        return result;
      },
      {}
    );

    const content = finalComments.map((item) => {
      const commentResponse =
        mapCommentResponse(item);
      const commentReplies =
        repliesByParentId[
          item._id.toString()
        ] || [];

      return {
        ...commentResponse,
        replies: commentReplies,
        replyCount: commentReplies.length,
      };
    });

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

async function getAllPostService(query) {
  try {
    const {
      userId,
      startDate,
      endDate,
      type,
      searchText,
      status,
      pageIndex = 0,
      pageSize = 10,
    } = query;

    const page =
      Math.max(Number(pageIndex) || 0, 0);
    const limit =
      Math.max(Number(pageSize) || 10, 1);

    const filter = {};

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return buildResponse(
          400,
          "Invalid userId",
          null
        );
      }

      filter.userId = userId;
    }

    if (type) {
      const upperType =
        String(type).toUpperCase();

      if (!["POST", "EVENT"].includes(upperType)) {
        return buildResponse(
          400,
          "type must be POST or EVENT",
          null
        );
      }

      filter.type = upperType;
    }

    if (
      status !== undefined &&
      status !== null &&
      status !== ""
    ) {
      const numericStatus = Number(status);

      if (![0, 1, 2].includes(numericStatus)) {
        return buildResponse(
          400,
          "status must be 0, 1 or 2",
          null
        );
      }

      filter.status = numericStatus;
    }

    const dateFilter = {};

    if (startDate) {
      const parsedStartDate =
        parseDateOnly(startDate);

      if (!parsedStartDate) {
        return buildResponse(
          400,
          "startDate must be in dd-MM-yyyy format",
          null
        );
      }

      dateFilter.$gte = parsedStartDate;
    }

    if (endDate) {
      const parsedEndDate =
        parseDateOnly(endDate, true);

      if (!parsedEndDate) {
        return buildResponse(
          400,
          "endDate must be in dd-MM-yyyy format",
          null
        );
      }

      dateFilter.$lte = parsedEndDate;
    }

    if (Object.keys(dateFilter).length) {
      filter.createdAt = dateFilter;
    }

    if (searchText) {
      const regex =
        new RegExp(String(searchText).trim(), "i");

      const matchedUsers =
        await User.find({
          $or: [
            { name: regex },
            { firstName: regex },
            { lastName: regex },
            { mobileNumber: regex },
          ],
        })
          .select("_id")
          .lean();

      filter.$or = [
        { title: regex },
        { description: regex },
      ];

      if (matchedUsers.length) {
        filter.$or.push({
          userId: {
            $in: matchedUsers.map(
              (item) => item._id
            ),
          },
        });
      }
    }

    const [posts, totalRecords] =
      await Promise.all([
        Post.find(filter)
          .populate({
            path: "userId",
            select:
              "name firstName lastName profileUrl villageId districtId",
            populate: [
              {
                path: "villageId",
                select: "name",
              },
              {
                path: "districtId",
                select: "name",
              },
            ],
          })
          .populate(
            "dharamshalaId",
            "name bannerImage address type"
          )
          .sort({ createdAt: -1 })
          .skip(page * limit)
          .limit(limit)
          .lean(),
        Post.countDocuments(filter),
      ]);

    const content =
      posts.map((post) =>
        mapPostResponse(post)
      );

    const totalPages =
      Math.ceil(totalRecords / limit);

    return buildResponse(
      200,
      "Posts fetched successfully",
      {
        content,
        pageIndex: page,
        pageSize: limit,
        totalRecords,
        totalPages,
        isLast: page + 1 >= totalPages,
        hasNext: page + 1 < totalPages,
        hasPrevious: page > 0,
      }
    );
  } catch (error) {
    logger.error("getAllPostService error", {
      error: error.message,
      stack: error.stack,
      query,
    });

    return buildResponse(
      500,
      "Internal Server Error",
      null
    );
  }
}

async function blockUnblockPostService(body) {
  try {
    const { id, status } = body;

    if (!id) {
      return buildResponse(
        400,
        "id is required",
        null
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return buildResponse(
        400,
        "Invalid id",
        null
      );
    }

    if (
      status === undefined ||
      status === null ||
      status === ""
    ) {
      return buildResponse(
        400,
        "status is required",
        null
      );
    }

    const numericStatus = Number(status);

    if (![0, 1, 2].includes(numericStatus)) {
      return buildResponse(
        400,
        "status must be 0, 1 or 2",
        null
      );
    }

    const post =
      await Post.findById(id);

    if (!post) {
      return buildResponse(
        404,
        "Record not found.",
        null
      );
    }

    if (post.status === numericStatus) {
      if (numericStatus === 1) {
        return buildResponse(
          400,
          "Post already active.",
          null
        );
      }

      if (numericStatus === 2) {
        return buildResponse(
          400,
          "Post already blocked.",
          null
        );
      }

      if (numericStatus === 0) {
        return buildResponse(
          400,
          "Post already deleted.",
          null
        );
      }
    }

    post.status = numericStatus;
    await post.save();

    const populatedPost =
      await Post.findById(id)
        .populate({
          path: "userId",
          select:
            "name firstName lastName profileUrl villageId districtId",
          populate: [
            {
              path: "villageId",
              select: "name",
            },
            {
              path: "districtId",
              select: "name",
            },
          ],
        })
        .populate(
          "dharamshalaId",
          "name bannerImage address type"
        );

    let message = "Post status updated successfully.";
    if (numericStatus === 0) {
      message = "Post deleted successfully.";
    }
    if (numericStatus === 1) {
      message = "Post activated successfully.";
    }
    if (numericStatus === 2) {
      message = "Post blocked successfully.";
    }

    return buildResponse(
      200,
      message,
      mapPostResponse(populatedPost)
    );
  } catch (error) {
    logger.error("blockUnblockPostService error", {
      error: error.message,
      stack: error.stack,
      body,
    });

    return buildResponse(
      500,
      "Internal Server Error",
      null
    );
  }
}

async function reportPostService(body) {
  try {
    const {
      feedId,
      issueType,
      descriptions = "",
      userId,
      feedType,
      status = 1,
      reportStatus = 1,
    } = body;

    if (!feedId) {
      return buildResponse(
        400,
        "feedId is required",
        null
      );
    }

    if (!mongoose.Types.ObjectId.isValid(feedId)) {
      return buildResponse(
        400,
        "Invalid feedId",
        null
      );
    }

    if (!userId) {
      return buildResponse(
        400,
        "userId is required",
        null
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return buildResponse(
        400,
        "Invalid userId",
        null
      );
    }

    if (!issueType || !String(issueType).trim()) {
      return buildResponse(
        400,
        "issueType is required",
        null
      );
    }

    const normalizedFeedType =
      String(feedType || "").toLowerCase() === "post"
        ? "Post"
        : String(feedType || "").toLowerCase() === "comment"
          ? "Comment"
          : "";

    if (!normalizedFeedType) {
      return buildResponse(
        400,
        "feedType must be Post or Comment",
        null
      );
    }

    const numericStatus = Number(status);
    const numericReportStatus =
      Number(reportStatus);

    if (![0, 1, 2].includes(numericStatus)) {
      return buildResponse(
        400,
        "status must be 0, 1 or 2",
        null
      );
    }

    if (![1, 2, 3].includes(numericReportStatus)) {
      return buildResponse(
        400,
        "reportStatus must be 1, 2 or 3",
        null
      );
    }

    const feedModel =
      normalizedFeedType === "Post"
        ? "post"
        : "post_comment";

    const existingFeed =
      normalizedFeedType === "Post"
        ? await Post.findById(feedId)
        : await PostComment.findById(feedId);

    if (!existingFeed) {
      return buildResponse(
        404,
        `${normalizedFeedType} not found`,
        null
      );
    }

    const reportingUser =
      await User.findById(userId).select("_id");

    if (!reportingUser) {
      return buildResponse(
        404,
        "User not found",
        null
      );
    }

    const report =
      await ReportSpam.create({
        feedId,
        feedModel,
        feedType: normalizedFeedType,
        issueType: String(issueType).trim(),
        descriptions,
        userId,
        status: numericStatus,
        reportStatus: numericReportStatus,
      });

    return buildResponse(
      200,
      "Report submitted successfully",
      report
    );
  } catch (error) {
    logger.error("reportPostService error", {
      error: error.message,
      stack: error.stack,
      body,
    });

    return buildResponse(
      500,
      "Internal Server Error",
      null
    );
  }
}

async function getAllReportService(query) {
  try {
    const {
      userId,
      feedId,
      feedType,
      status,
      reportStatus,
      searchText,
      pageIndex = 0,
      pageSize = 10,
    } = query;

    const page =
      Math.max(Number(pageIndex) || 0, 0);
    const limit =
      Math.max(Number(pageSize) || 10, 1);

    const filter = {};

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return buildResponse(
          400,
          "Invalid userId",
          null
        );
      }

      filter.userId = userId;
    }

    if (feedId) {
      if (!mongoose.Types.ObjectId.isValid(feedId)) {
        return buildResponse(
          400,
          "Invalid feedId",
          null
        );
      }

      filter.feedId = feedId;
    }

    if (feedType) {
      const normalizedFeedType =
        String(feedType).toLowerCase() === "post"
          ? "Post"
          : String(feedType).toLowerCase() === "comment"
            ? "Comment"
            : "";

      if (!normalizedFeedType) {
        return buildResponse(
          400,
          "feedType must be Post or Comment",
          null
        );
      }

      filter.feedType = normalizedFeedType;
    }

    if (
      status !== undefined &&
      status !== null &&
      status !== ""
    ) {
      const numericStatus = Number(status);

      if (![0, 1, 2].includes(numericStatus)) {
        return buildResponse(
          400,
          "status must be 0, 1 or 2",
          null
        );
      }

      filter.status = numericStatus;
    }

    if (
      reportStatus !== undefined &&
      reportStatus !== null &&
      reportStatus !== ""
    ) {
      const numericReportStatus =
        Number(reportStatus);

      if (![1, 2, 3].includes(numericReportStatus)) {
        return buildResponse(
          400,
          "reportStatus must be 1, 2 or 3",
          null
        );
      }

      filter.reportStatus =
        numericReportStatus;
    }

    if (searchText) {
      const regex =
        new RegExp(String(searchText).trim(), "i");

      filter.$or = [
        { issueType: regex },
        { descriptions: regex },
      ];
    }

    const [reports, totalRecords] =
      await Promise.all([
        ReportSpam.find(filter)
          .populate(
            "userId",
            "name firstName lastName mobileNumber profileUrl"
          )
          .populate("feedId")
          .sort({ createdAt: -1 })
          .skip(page * limit)
          .limit(limit)
          .lean(),
        ReportSpam.countDocuments(filter),
      ]);

    const content =
      reports.map((item) => {
        const reportedByUserResponse =
          mapReportedByUserResponse(
            item.userId
          );

        const {
          feedResponse,
          postResponse,
          commentResponse,
        } = mapReportFeedResponse(item);

        return {
          id: item._id,
          feedId: item.feedId?._id || item.feedId,
          feedType: item.feedType,
          issueType: item.issueType,
          descriptions: item.descriptions || "",
          status: item.status,
          reportStatus: item.reportStatus,
          reportStatusLabel:
            item.reportStatus === 1
              ? "Pending"
              : item.reportStatus === 2
                ? "Open"
                : "Closed",
          reportedByUserResponse,
          userResponse: reportedByUserResponse,
          feedResponse,
          postResponse,
          commentResponse,
          createdAt: formatDate(item.createdAt),
          updatedAt: formatDate(item.updatedAt),
        };
      });

    const totalPages =
      Math.ceil(totalRecords / limit);

    return buildResponse(
      200,
      "Reports fetched successfully",
      {
        content,
        pageIndex: page,
        pageSize: limit,
        totalRecords,
        totalPages,
        isLast: page + 1 >= totalPages,
        hasNext: page + 1 < totalPages,
        hasPrevious: page > 0,
      }
    );
  } catch (error) {
    logger.error("getAllReportService error", {
      error: error.message,
      stack: error.stack,
      query,
    });

    return buildResponse(
      500,
      "Internal Server Error",
      null
    );
  }
}

async function blockUnblockReportService(body) {
  try {
    const { id, status } = body;

    if (!id) {
      return buildResponse(
        400,
        "id is required",
        null
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return buildResponse(
        400,
        "Invalid id",
        null
      );
    }

    if (
      status === undefined ||
      status === null ||
      status === ""
    ) {
      return buildResponse(
        400,
        "status is required",
        null
      );
    }

    const numericStatus = Number(status);

    if (![0, 1, 2].includes(numericStatus)) {
      return buildResponse(
        400,
        "status must be 0, 1 or 2",
        null
      );
    }

    const report =
      await ReportSpam.findById(id);

    if (!report) {
      return buildResponse(
        404,
        "Report not found",
        null
      );
    }

    if (report.status === numericStatus) {
      if (numericStatus === 1) {
        return buildResponse(
          400,
          "Report already active.",
          null
        );
      }

      if (numericStatus === 2) {
        return buildResponse(
          400,
          "Report already blocked.",
          null
        );
      }

      if (numericStatus === 0) {
        return buildResponse(
          400,
          "Report already deleted.",
          null
        );
      }
    }

    report.status = numericStatus;
    await report.save();

    let message = "Report status updated successfully.";
    if (numericStatus === 0) {
      message = "Report deleted successfully.";
    }
    if (numericStatus === 1) {
      message = "Report activated successfully.";
    }
    if (numericStatus === 2) {
      message = "Report blocked successfully.";
    }

    return buildResponse(
      200,
      message,
      report
    );
  } catch (error) {
    logger.error("blockUnblockReportService error", {
      error: error.message,
      stack: error.stack,
      body,
    });

    return buildResponse(
      500,
      "Internal Server Error",
      null
    );
  }
}

async function openCloseReportService(body) {
  try {
    const { id, reportStatus } = body;

    if (!id) {
      return buildResponse(
        400,
        "id is required",
        null
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return buildResponse(
        400,
        "Invalid id",
        null
      );
    }

    if (
      reportStatus === undefined ||
      reportStatus === null ||
      reportStatus === ""
    ) {
      return buildResponse(
        400,
        "reportStatus is required",
        null
      );
    }

    const numericReportStatus =
      Number(reportStatus);

    if (![1, 2, 3].includes(numericReportStatus)) {
      return buildResponse(
        400,
        "reportStatus must be 1, 2 or 3",
        null
      );
    }

    const report =
      await ReportSpam.findById(id);

    if (!report) {
      return buildResponse(
        404,
        "Report not found",
        null
      );
    }

    if (report.reportStatus === numericReportStatus) {
      const label =
        numericReportStatus === 1
          ? "pending"
          : numericReportStatus === 2
            ? "open"
            : "closed";

      return buildResponse(
        400,
        `Report already ${label}.`,
        null
      );
    }

    report.reportStatus = numericReportStatus;
    await report.save();

    const message =
      numericReportStatus === 1
        ? "Report marked as pending successfully."
        : numericReportStatus === 2
          ? "Report opened successfully."
          : "Report closed successfully.";

    return buildResponse(
      200,
      message,
      report
    );
  } catch (error) {
    logger.error("openCloseReportService error", {
      error: error.message,
      stack: error.stack,
      body,
    });

    return buildResponse(
      500,
      "Internal Server Error",
      null
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
  getAllPostService,
  blockUnblockPostService,
  reportPostService,
  getAllReportService,
  blockUnblockReportService,
  openCloseReportService,
};
