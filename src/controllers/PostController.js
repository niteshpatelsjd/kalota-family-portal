const {
  createPostService,
  editPostService,
  deletePostService,
  getFeedService,
  likeUnlikePostService,
  addCommentService,
  getCommentsService,
  viewPostService,
  sharePostService,
  getLikersService,
  getViewersService,
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

async function editPost(req, res) {
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.body.userId;

  const response = await editPostService(
    req.body,
    req.files,
    userId
  );

  return res
    .status(response.responseCode || 200)
    .json(response);
}

async function deletePost(req, res) {
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.body.userId;

  const response = await deletePostService(
    req.body,
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

async function getViewers(req, res) {
  try {
    const { postId, pageIndex = 0, pageSize = 20 } = req.query;

    const response = await getViewersService({
      postId,
      pageIndex: Number(pageIndex),
      pageSize: Number(pageSize),
    });

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}

async function getLikers(req, res) {
  try {
    const { postId, pageIndex = 0, pageSize = 20 } = req.query;

    const response = await getLikersService({
      postId,
      pageIndex: Number(pageIndex),
      pageSize: Number(pageSize),
    });

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}

async function likeUnlikePost(req, res) {
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.body.userId;

  const response = await likeUnlikePostService(
    req.body,
    userId
  );

  return res
    .status(response.responseCode || 200)
    .json(response);
}

async function addComment(req, res) {
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.body.userId;

  const response = await addCommentService(
    req.body,
    userId
  );

  return res
    .status(response.responseCode || 200)
    .json(response);
}

async function viewPost(req, res) {
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.body.userId;

  const response = await viewPostService(
    req.body,
    userId
  );

  return res
    .status(response.responseCode || 200)
    .json(response);
}


async function getComments(req, res) {
  const response = await getCommentsService(req.query);

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
  getLikers,
  getViewers,
  sharePost,
  editPost,
  deletePost,
};