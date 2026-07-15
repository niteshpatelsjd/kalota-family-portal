const socialService = require("../services/SocialService");

exports.sendFollowRequest = async (req, res) => {
  const response = await socialService.sendFollowRequest(req.body);

  return res.status(response.responseCode || 200).json(response);
};

exports.respondFollowRequest = async (req, res) => {
  const response = await socialService.respondFollowRequest(req.body);

  return res.status(response.responseCode || 200).json(response);
};

exports.getFollowRequests = async (req, res) => {
  const response = await socialService.getFollowRequests(req.query);

  return res.status(response.responseCode || 200).json(response);
};

exports.getFollowers = async (req, res) => {
  const response = await socialService.getFollowers({
    ...req.query,
    loggedInUserId:
      req.user?._id ||
      req.user?.id,
  });

  return res.status(response.responseCode || 200).json(response);
};

exports.getFollowing = async (req, res) => {
  const response = await socialService.getFollowing({
    ...req.query,
    loggedInUserId:
      req.user?._id ||
      req.user?.id,
  });

  return res.status(response.responseCode || 200).json(response);
};

exports.blockUser = async (req, res) => {
  const response = await socialService.blockUser(req.body);

  return res.status(response.responseCode || 200).json(response);
};

exports.unblockUser = async (req, res) => {
  const response = await socialService.unblockUser(req.body);

  return res.status(response.responseCode || 200).json(response);
};

exports.getBlockedUsers = async (req, res) => {
  const response = await socialService.getBlockedUsers(req.query);

  return res.status(response.responseCode || 200).json(response);
};

exports.unfollowUser = async (req, res) => {
  const response = await socialService.unfollowUser(req.body);

  return res.status(response.responseCode || 200).json(response);
};

exports.getSocialSummary = async (req, res) => {
  const response = await socialService.getSocialSummary(req.query);

  return res.status(response.responseCode || 200).json(response);
};
