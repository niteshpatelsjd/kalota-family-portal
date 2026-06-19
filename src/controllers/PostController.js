const {
  createPostService,
  getFeedService,
  likeUnlikePostService,
  addCommentService,
  getCommentsService,
  viewPostService,
  sharePostService,
} = require("../services/PostService");

async function createPost(req, res) {
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.body.userId;

  const response = await createPostService(
    req.body,
    req.files,
    userId
  );

  return res
    .status(response.responseCode || 200)
    .json(response);
}

async function getFeed(req, res) {

  const response = await getFeedService(
    req.query
  );

  return res.status(200).json(response);
}

async function likeUnlikePost(req, res) {
  const userId = req.user?._id || req.user?.id;

  const response = await likeUnlikePostService(
    req.body,
    userId
  );

  return res.status(200).json(response);
}

async function addComment(req, res) {
  const userId = req.user?._id || req.user?.id;

  const response = await addCommentService(
    req.body,
    userId
  );

  return res.status(200).json(response);
}

async function getComments(req, res) {
  const response = await getCommentsService(req.query);

  return res.status(200).json(response);
}

async function viewPost(req, res) {
  const userId = req.user?._id || req.user?.id;

  const response = await viewPostService(
    req.body,
    userId
  );

  return res.status(200).json(response);
}

async function sharePost(req, res) {
  const response = await sharePostService(req.body);

  return res.status(200).json(response);
}

module.exports = {
  createPost,
  getFeed,
  likeUnlikePost,
  addComment,
  getComments,
  viewPost,
  sharePost,
};