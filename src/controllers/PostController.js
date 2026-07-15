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
  getAllPostService,
  blockUnblockPostService,
  reportPostService,
  getAllReportService,
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
    const { postId, viewerId, userId, pageIndex = 0, pageSize = 20 } = req.query;

    const response = await getViewersService({
      postId,
      viewerId: viewerId || userId,
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
    const { postId, viewerId, userId, pageIndex = 0, pageSize = 20 } = req.query;

    const response = await getLikersService({
      postId,
      viewerId: viewerId || userId,
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
  const userId =
    req.user?._id ||
    req.user?.id ||
    req.body.userId;

  const response = await sharePostService(req.body, userId);

  return res.status(200).json(response);
}

async function getAllPost(req, res) {
  const response =
    await getAllPostService(req.query);

  return res
    .status(response.responseCode || 200)
    .json(response);
}

async function blockUnblockPost(req, res) {
  const response =
    await blockUnblockPostService(req.body);

  return res
    .status(response.responseCode || 200)
    .json(response);
}

async function reportPost(req, res) {
  const response =
    await reportPostService(req.body);

  return res
    .status(response.responseCode || 200)
    .json(response);
}

async function getAllReport(req, res) {
  const response =
    await getAllReportService(req.query);

  return res
    .status(response.responseCode || 200)
    .json(response);
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
  getAllPost,
  blockUnblockPost,
  reportPost,
  getAllReport,
  sharePost,
  editPost,
  deletePost,
};
