const mongoose = require("mongoose");
const UserFollow = require("../models/UserFollow");
const UserFollowRequest = require("../models/UserFollowRequest");
const UserBlock = require("../models/UserBlock");

function toObjectId(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(id);
}

function sameId(firstId, secondId) {
  if (!firstId || !secondId) return false;

  return firstId.toString() === secondId.toString();
}

async function getBlockBetween(userAId, userBId) {
  const userA = toObjectId(userAId);
  const userB = toObjectId(userBId);

  if (!userA || !userB) {
    return {
      isBlocked: false,
      blockedByMe: false,
      blockedMe: false,
    };
  }

  if (sameId(userA, userB)) {
    return {
      isBlocked: false,
      blockedByMe: false,
      blockedMe: false,
    };
  }

  const blocks = await UserBlock.find({
    status: 1,
    $or: [
      { blockerId: userA, blockedUserId: userB },
      { blockerId: userB, blockedUserId: userA },
    ],
  }).lean();

  const blockedByMe = blocks.some((item) =>
    sameId(item.blockerId, userA)
  );
  const blockedMe = blocks.some((item) =>
    sameId(item.blockerId, userB)
  );

  return {
    isBlocked: blockedByMe || blockedMe,
    blockedByMe,
    blockedMe,
  };
}

async function isFollowing(followerId, followingId) {
  const follower = toObjectId(followerId);
  const following = toObjectId(followingId);

  if (!follower || !following) return false;

  const follow = await UserFollow.exists({
    followerId: follower,
    followingId: following,
    status: 1,
  });

  return !!follow;
}

async function getFollowStatus(viewerId, targetUserId) {
  const viewer = toObjectId(viewerId);
  const target = toObjectId(targetUserId);

  if (!viewer || !target) return "NONE";

  if (sameId(viewer, target)) return "SELF";

  const blockState = await getBlockBetween(viewer, target);

  if (blockState.blockedByMe) return "BLOCKED_BY_ME";
  if (blockState.blockedMe) return "BLOCKED_ME";

  const follow = await UserFollow.exists({
    followerId: viewer,
    followingId: target,
    status: 1,
  });

  if (follow) return "FOLLOWING";

  const request = await UserFollowRequest.findOne({
    requesterId: viewer,
    targetUserId: target,
    status: "PENDING",
  }).lean();

  if (request) return "REQUESTED";

  const incomingRequest = await UserFollowRequest.findOne({
    requesterId: target,
    targetUserId: viewer,
    status: "PENDING",
  }).lean();

  if (incomingRequest) return "PENDING_APPROVAL";

  return "NONE";
}

async function canViewProfile(viewerId, targetUserId) {
  if (!viewerId || !targetUserId) {
    return {
      canView: false,
      isSelf: false,
      followStatus: "NONE",
      reason: "PRIVATE_PROFILE",
    };
  }

  if (sameId(viewerId, targetUserId)) {
    return {
      canView: true,
      isSelf: true,
      followStatus: "SELF",
      reason: null,
    };
  }

  const blockState = await getBlockBetween(viewerId, targetUserId);

  if (blockState.blockedByMe) {
    return {
      canView: false,
      isSelf: false,
      followStatus: "BLOCKED_BY_ME",
      reason: "BLOCKED_BY_ME",
    };
  }

  if (blockState.blockedMe) {
    return {
      canView: false,
      isSelf: false,
      followStatus: "BLOCKED_ME",
      reason: "BLOCKED_ME",
    };
  }

  const followed = await isFollowing(viewerId, targetUserId);

  return {
    canView: followed,
    isSelf: false,
    followStatus: followed ? "FOLLOWING" : await getFollowStatus(viewerId, targetUserId),
    reason: followed ? null : "PRIVATE_PROFILE",
  };
}

async function canViewPost(viewerId, postOwnerId) {
  return canViewProfile(viewerId, postOwnerId);
}

async function getBlockedUserIds(userId) {
  const viewer = toObjectId(userId);

  if (!viewer) return [];

  const blocks = await UserBlock.find({
    status: 1,
    $or: [{ blockerId: viewer }, { blockedUserId: viewer }],
  })
    .select("blockerId blockedUserId")
    .lean();

  return blocks.map((item) =>
    sameId(item.blockerId, viewer)
      ? item.blockedUserId
      : item.blockerId
  );
}

async function getBlockedByMeUserIds(userId) {
  const viewer = toObjectId(userId);

  if (!viewer) return [];

  const blocks = await UserBlock.find({
    blockerId: viewer,
    status: 1,
  })
    .select("blockedUserId")
    .lean();

  return blocks.map((item) => item.blockedUserId);
}

async function getFollowCounts(userId) {
  const userObjectId = toObjectId(userId);

  if (!userObjectId) {
    return {
      followersCount: 0,
      followingCount: 0,
    };
  }

  const [followersCount, followingCount] = await Promise.all([
    UserFollow.countDocuments({
      followingId: userObjectId,
      status: 1,
    }),
    UserFollow.countDocuments({
      followerId: userObjectId,
      status: 1,
    }),
  ]);

  return {
    followersCount,
    followingCount,
  };
}

module.exports = {
  toObjectId,
  sameId,
  getBlockBetween,
  isFollowing,
  getFollowStatus,
  canViewProfile,
  canViewPost,
  getBlockedUserIds,
  getBlockedByMeUserIds,
  getFollowCounts,
};
