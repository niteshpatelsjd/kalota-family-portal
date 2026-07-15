const mongoose = require("mongoose");
const User = require("../models/User");
const UserFollow = require("../models/UserFollow");
const UserFollowRequest = require("../models/UserFollowRequest");
const UserBlock = require("../models/UserBlock");
const buildResponse = require("../utils/response");
const DataConstant = require("../constants/DataConstant");
const logger = require("../utils/logger");
const userResponse = require("../response/UserResponse");
const visibilityService = require("./UserVisibilityService");
const {
  sendNotificationToUserService,
} = require("./NotificationService");

function normalizeAction(action) {
  return String(action || "").trim().toUpperCase();
}

function parsePagination(pageIndex = 0, pageSize = 20) {
  const page = Math.max(Number(pageIndex) || 0, 0);
  const limit = Math.min(Math.max(Number(pageSize) || 20, 1), 100);

  return {
    page,
    limit,
    skip: page * limit,
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

async function sendFollowRequestNotification({
  requestId,
  requester,
  targetUserId,
}) {
  try {
    const requesterName = getUserDisplayName(requester);

    await sendNotificationToUserService({
      userId: targetUserId,
      senderId: requester._id,
      title: "New follow request",
      message: `${requesterName} sent you a follow request`,
      type: "FOLLOW_REQUEST",
      data: {
        requestId: requestId.toString(),
        requesterId: requester._id.toString(),
        requesterName,
      },
    });
  } catch (notificationErr) {
    logger.error("Follow request notification failed", {
      error: notificationErr.message,
      stack: notificationErr.stack,
      requestId,
      targetUserId,
    });
  }
}

async function sendFollowAcceptedNotification({
  requestId,
  requesterId,
  acceptedByUser,
  acceptedByUserId,
}) {
  try {
    const acceptedByName = getUserDisplayName(acceptedByUser);

    await sendNotificationToUserService({
      userId: requesterId,
      senderId: acceptedByUser?._id || acceptedByUserId,
      title: "Follow request accepted",
      message: `${acceptedByName} accepted your follow request`,
      type: "FOLLOW_ACCEPTED",
      data: {
        requestId: requestId.toString(),
        acceptedBy: (
          acceptedByUser?._id || acceptedByUserId
        ).toString(),
        acceptedByName,
      },
    });
  } catch (notificationErr) {
    logger.error("Follow accepted notification failed", {
      error: notificationErr.message,
      stack: notificationErr.stack,
      requestId,
      requesterId,
    });
  }
}

async function validateActiveUsers(firstUserId, secondUserId) {
  if (
    !mongoose.Types.ObjectId.isValid(firstUserId) ||
    !mongoose.Types.ObjectId.isValid(secondUserId)
  ) {
    return {
      valid: false,
      response: buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid user ids are required",
        null
      ),
    };
  }

  if (firstUserId.toString() === secondUserId.toString()) {
    return {
      valid: false,
      response: buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Same user action is not allowed",
        null
      ),
    };
  }

  const [firstUser, secondUser] = await Promise.all([
    User.findOne({ _id: firstUserId, status: 1 }).lean(),
    User.findOne({ _id: secondUserId, status: 1 }).lean(),
  ]);

  if (!firstUser || !secondUser) {
    return {
      valid: false,
      response: buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "User not found or inactive",
        null
      ),
    };
  }

  return {
    valid: true,
    firstUser,
    secondUser,
  };
}

async function buildUserCard(user, viewerId) {
  const [counts, followStatus] = await Promise.all([
    visibilityService.getFollowCounts(user._id),
    visibilityService.getFollowStatus(viewerId, user._id),
  ]);

  return {
    id: user._id,
    name: user.name || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    profileUrl: user.profileUrl || "",
    villageName: user.villageId?.name || "",
    districtName: user.districtId?.name || "",
    isPrivate: true,
    followStatus,
    ...counts,
  };
}

async function sendFollowRequest({ requesterId, targetUserId }) {
  try {
    const validation = await validateActiveUsers(requesterId, targetUserId);

    if (!validation.valid) return validation.response;

    const blockState = await visibilityService.getBlockBetween(
      requesterId,
      targetUserId
    );

    if (blockState.isBlocked) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.FORBIDDEN,
        "Follow request is not allowed because user is blocked",
        { followStatus: blockState.blockedByMe ? "BLOCKED_BY_ME" : "BLOCKED_ME" }
      );
    }

    const existingFollow = await UserFollow.findOne({
      followerId: requesterId,
      followingId: targetUserId,
      status: 1,
    }).lean();

    if (existingFollow) {
      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Already following this user",
        { followStatus: "FOLLOWING" }
      );
    }

    const existingRequest = await UserFollowRequest.findOne({
      requesterId,
      targetUserId,
    });

    if (existingRequest && existingRequest.status === "PENDING") {
      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Follow request already sent",
        {
          requestId: existingRequest._id,
          followStatus: "REQUESTED",
        }
      );
    }

    if (existingRequest) {
      existingRequest.status = "PENDING";
      existingRequest.requestedAt = new Date();
      existingRequest.respondedAt = null;
      await existingRequest.save();

      await sendFollowRequestNotification({
        requestId: existingRequest._id,
        requester: validation.firstUser,
        targetUserId,
      });

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Follow request sent successfully",
        {
          requestId: existingRequest._id,
          followStatus: "REQUESTED",
        }
      );
    }

    const request = await UserFollowRequest.create({
      requesterId,
      targetUserId,
      status: "PENDING",
    });

    await sendFollowRequestNotification({
      requestId: request._id,
      requester: validation.firstUser,
      targetUserId,
    });

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Follow request sent successfully",
      {
        requestId: request._id,
        followStatus: "REQUESTED",
      }
    );
  } catch (error) {
    logger.error("sendFollowRequest error", {
      error: error.message,
      stack: error.stack,
      requesterId,
      targetUserId,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong",
      null
    );
  }
}

async function respondFollowRequest({ requestId, userId, action }) {
  const session = await mongoose.startSession();

  try {
    const normalizedAction = normalizeAction(action);

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid requestId is required",
        null
      );
    }

    if (!["ACCEPT", "REJECT"].includes(normalizedAction)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "action must be ACCEPT or REJECT",
        null
      );
    }

    session.startTransaction();

    const request = await UserFollowRequest.findOne({
      _id: requestId,
      targetUserId: userId,
      status: "PENDING",
    }).session(session);

    if (!request) {
      await session.abortTransaction();

      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Pending follow request not found",
        null
      );
    }

    if (normalizedAction === "REJECT") {
      request.status = "REJECTED";
      request.respondedAt = new Date();
      await request.save({ session });

      await session.commitTransaction();

      return buildResponse(
        DataConstant.SUCCESS.OK,
        "Follow request rejected successfully",
        { followStatus: "NONE" }
      );
    }

    const blockState = await visibilityService.getBlockBetween(
      request.requesterId,
      request.targetUserId
    );

    if (blockState.isBlocked) {
      await session.abortTransaction();

      return buildResponse(
        DataConstant.CLIENT_ERROR.FORBIDDEN,
        "Cannot accept request because user is blocked",
        null
      );
    }

    request.status = "ACCEPTED";
    request.respondedAt = new Date();
    await request.save({ session });

    await UserFollow.findOneAndUpdate(
      {
        followerId: request.requesterId,
        followingId: request.targetUserId,
      },
      {
        followerId: request.requesterId,
        followingId: request.targetUserId,
        status: 1,
      },
      {
        upsert: true,
        new: true,
        session,
        setDefaultsOnInsert: true,
      }
    );

    await session.commitTransaction();

    const acceptedByUser = await User.findById(userId).lean();

    await sendFollowAcceptedNotification({
      requestId: request._id,
      requesterId: request.requesterId,
      acceptedByUser,
      acceptedByUserId: userId,
    });

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Follow request accepted successfully",
      { followStatus: "FOLLOWING" }
    );
  } catch (error) {
    await session.abortTransaction();

    logger.error("respondFollowRequest error", {
      error: error.message,
      stack: error.stack,
      requestId,
      userId,
      action,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong",
      null
    );
  } finally {
    session.endSession();
  }
}

async function getFollowRequests({
  userId,
  type = "RECEIVED",
  pageIndex = 0,
  pageSize = 20,
}) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid userId is required",
        null
      );
    }

    const { page, limit, skip } = parsePagination(pageIndex, pageSize);
    const normalizedType = String(type || "RECEIVED").toUpperCase();
    const query =
      normalizedType === "SENT"
        ? { requesterId: userId, status: "PENDING" }
        : { targetUserId: userId, status: "PENDING" };

    const populatePath =
      normalizedType === "SENT" ? "targetUserId" : "requesterId";

    const [requests, totalRecords] = await Promise.all([
      UserFollowRequest.find(query)
        .populate({
          path: populatePath,
          select: "name firstName lastName profileUrl villageId districtId",
          populate: [
            { path: "villageId", select: "name" },
            { path: "districtId", select: "name" },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserFollowRequest.countDocuments(query),
    ]);

    const content = await Promise.all(
      requests.map(async (item) => ({
        requestId: item._id,
        requestedAt: item.requestedAt || item.createdAt,
        user: await buildUserCard(item[populatePath], userId),
      }))
    );

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Follow requests fetched successfully",
      {
        content,
        pageIndex: page,
        pageSize: limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        isLast: page + 1 >= Math.ceil(totalRecords / limit),
        hasNext: page + 1 < Math.ceil(totalRecords / limit),
        hasPrevious: page > 0,
      }
    );
  } catch (error) {
    logger.error("getFollowRequests error", {
      error: error.message,
      stack: error.stack,
      userId,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong",
      null
    );
  }
}

async function getFollowers({
  userId,
  viewerId,
  loggedInUserId,
  pageIndex = 0,
  pageSize = 20,
}) {
  try {
    const targetUserId =
      userId ||
      viewerId ||
      loggedInUserId;

    const resolvedViewerId =
      viewerId ||
      loggedInUserId ||
      targetUserId;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid userId or viewerId is required",
        null
      );
    }

    const { page, limit, skip } = parsePagination(pageIndex, pageSize);
    const blockedUserIds = await visibilityService.getBlockedUserIds(resolvedViewerId);
    const query = {
      followingId: targetUserId,
      status: 1,
      ...(blockedUserIds.length
        ? { followerId: { $nin: blockedUserIds } }
        : {}),
    };

    const [followers, totalRecords, counts] = await Promise.all([
      UserFollow.find(query)
        .populate({
          path: "followerId",
          select: "name firstName lastName profileUrl villageId districtId",
          populate: [
            { path: "villageId", select: "name" },
            { path: "districtId", select: "name" },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserFollow.countDocuments(query),
      visibilityService.getFollowCounts(targetUserId),
    ]);

    const content = await Promise.all(
      followers
        .filter((item) => item.followerId)
        .map((item) => buildUserCard(item.followerId, resolvedViewerId))
    );

    return buildResponse(DataConstant.SUCCESS.OK, "Followers fetched successfully", {
      content,
      ...counts,
      totalRecords,
      pageIndex: page,
      pageSize: limit,
      totalPages: Math.ceil(totalRecords / limit),
      isLast: page + 1 >= Math.ceil(totalRecords / limit),
      hasNext: page + 1 < Math.ceil(totalRecords / limit),
      hasPrevious: page > 0,
    });
  } catch (error) {
    logger.error("getFollowers error", {
      error: error.message,
      stack: error.stack,
      userId,
      viewerId,
      loggedInUserId,
    });

    return buildResponse(DataConstant.SERVER_ERROR.SERVER_ERROR, "Something went wrong", null);
  }
}

async function getFollowing({
  userId,
  viewerId,
  loggedInUserId,
  pageIndex = 0,
  pageSize = 20,
}) {
  try {
    const targetUserId =
      userId ||
      viewerId ||
      loggedInUserId;

    const resolvedViewerId =
      viewerId ||
      loggedInUserId ||
      targetUserId;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid userId or viewerId is required",
        null
      );
    }

    const { page, limit, skip } = parsePagination(pageIndex, pageSize);
    const blockedUserIds = await visibilityService.getBlockedUserIds(resolvedViewerId);
    const query = {
      followerId: targetUserId,
      status: 1,
      ...(blockedUserIds.length
        ? { followingId: { $nin: blockedUserIds } }
        : {}),
    };

    const [following, totalRecords, counts] = await Promise.all([
      UserFollow.find(query)
        .populate({
          path: "followingId",
          select: "name firstName lastName profileUrl villageId districtId",
          populate: [
            { path: "villageId", select: "name" },
            { path: "districtId", select: "name" },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserFollow.countDocuments(query),
      visibilityService.getFollowCounts(targetUserId),
    ]);

    const content = await Promise.all(
      following
        .filter((item) => item.followingId)
        .map((item) => buildUserCard(item.followingId, resolvedViewerId))
    );

    return buildResponse(DataConstant.SUCCESS.OK, "Following fetched successfully", {
      content,
      ...counts,
      totalRecords,
      pageIndex: page,
      pageSize: limit,
      totalPages: Math.ceil(totalRecords / limit),
      isLast: page + 1 >= Math.ceil(totalRecords / limit),
      hasNext: page + 1 < Math.ceil(totalRecords / limit),
      hasPrevious: page > 0,
    });
  } catch (error) {
    logger.error("getFollowing error", {
      error: error.message,
      stack: error.stack,
      userId,
      viewerId,
      loggedInUserId,
    });

    return buildResponse(DataConstant.SERVER_ERROR.SERVER_ERROR, "Something went wrong", null);
  }
}

async function blockUser({ blockerId, blockedUserId }) {
  const session = await mongoose.startSession();

  try {
    const validation = await validateActiveUsers(blockerId, blockedUserId);

    if (!validation.valid) return validation.response;

    session.startTransaction();

    const block = await UserBlock.findOneAndUpdate(
      { blockerId, blockedUserId },
      {
        blockerId,
        blockedUserId,
        status: 1,
        blockedAt: new Date(),
        unblockedAt: null,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        session,
      }
    );

    await UserFollow.updateMany(
      {
        $or: [
          { followerId: blockerId, followingId: blockedUserId },
          { followerId: blockedUserId, followingId: blockerId },
        ],
      },
      { $set: { status: 0 } },
      { session }
    );

    await UserFollowRequest.updateMany(
      {
        status: "PENDING",
        $or: [
          { requesterId: blockerId, targetUserId: blockedUserId },
          { requesterId: blockedUserId, targetUserId: blockerId },
        ],
      },
      {
        $set: {
          status: "CANCELLED",
          respondedAt: new Date(),
        },
      },
      { session }
    );

    await session.commitTransaction();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "User blocked successfully",
      {
        blockId: block._id,
        followStatus: "BLOCKED_BY_ME",
      }
    );
  } catch (error) {
    await session.abortTransaction();

    logger.error("blockUser error", {
      error: error.message,
      stack: error.stack,
      blockerId,
      blockedUserId,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong",
      null
    );
  } finally {
    session.endSession();
  }
}

async function unblockUser({ blockerId, blockedUserId }) {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(blockerId) ||
      !mongoose.Types.ObjectId.isValid(blockedUserId)
    ) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid user ids are required",
        null
      );
    }

    const block = await UserBlock.findOne({
      blockerId,
      blockedUserId,
      status: 1,
    });

    if (!block) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Active block record not found",
        null
      );
    }

    block.status = 0;
    block.unblockedAt = new Date();
    await block.save();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "User unblocked successfully",
      { followStatus: "NONE" }
    );
  } catch (error) {
    logger.error("unblockUser error", {
      error: error.message,
      stack: error.stack,
      blockerId,
      blockedUserId,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong",
      null
    );
  }
}

async function getBlockedUsers({
  userId,
  pageIndex = 0,
  pageSize = 20,
}) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid userId is required",
        null
      );
    }

    const { page, limit, skip } = parsePagination(pageIndex, pageSize);
    const query = {
      blockerId: userId,
      status: 1,
    };

    const [blockedRecords, totalRecords] = await Promise.all([
      UserBlock.find(query)
        .populate({
          path: "blockedUserId",
          select: "name firstName lastName profileUrl villageId districtId status",
          populate: [
            { path: "villageId", select: "name" },
            { path: "districtId", select: "name" },
          ],
        })
        .sort({ blockedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserBlock.countDocuments(query),
    ]);

    const content = await Promise.all(
      blockedRecords
        .filter((item) => item.blockedUserId)
        .map(async (item) => ({
          blockId: item._id,
          blockedAt: item.blockedAt || item.createdAt,
          user: {
            ...(await buildUserCard(item.blockedUserId, userId)),
            followStatus: "BLOCKED_BY_ME",
          },
        }))
    );

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Blocked users fetched successfully",
      {
        content,
        pageIndex: page,
        pageSize: limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        isLast: page + 1 >= Math.ceil(totalRecords / limit),
        hasNext: page + 1 < Math.ceil(totalRecords / limit),
        hasPrevious: page > 0,
      }
    );
  } catch (error) {
    logger.error("getBlockedUsers error", {
      error: error.message,
      stack: error.stack,
      userId,
      pageIndex,
      pageSize,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong",
      null
    );
  }
}

async function unfollowUser({ followerId, followingId }) {
  try {
    const validation = await validateActiveUsers(followerId, followingId);

    if (!validation.valid) return validation.response;

    const follow = await UserFollow.findOne({
      followerId,
      followingId,
      status: 1,
    });

    if (!follow) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "Active follow relation not found",
        { followStatus: "NONE" }
      );
    }

    follow.status = 0;
    await follow.save();

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "User unfollowed successfully",
      { followStatus: "NONE" }
    );
  } catch (error) {
    logger.error("unfollowUser error", {
      error: error.message,
      stack: error.stack,
      followerId,
      followingId,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong",
      null
    );
  }
}

async function getSocialSummary({ userId, viewerId }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.BAD_REQUEST,
        "Valid userId is required",
        null
      );
    }

    const user = await User.findById(userId)
      .populate("districtId", "name")
      .populate("villageId", "name")
      .lean();

    if (!user) {
      return buildResponse(
        DataConstant.CLIENT_ERROR.NOT_FOUND,
        "User not found",
        null
      );
    }

    const [counts, followStatus] = await Promise.all([
      visibilityService.getFollowCounts(userId),
      visibilityService.getFollowStatus(viewerId, userId),
    ]);

    return buildResponse(
      DataConstant.SUCCESS.OK,
      "Social summary fetched successfully",
      {
        ...userResponse.buildUserResponse(user),
        isPrivate: true,
        followStatus,
        ...counts,
      }
    );
  } catch (error) {
    logger.error("getSocialSummary error", {
      error: error.message,
      stack: error.stack,
      userId,
      viewerId,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR.SERVER_ERROR,
      "Something went wrong",
      null
    );
  }
}

module.exports = {
  sendFollowRequest,
  respondFollowRequest,
  getFollowRequests,
  getFollowers,
  getFollowing,
  blockUser,
  unblockUser,
  getBlockedUsers,
  unfollowUser,
  getSocialSummary,
};
