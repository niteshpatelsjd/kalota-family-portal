// controllers/DonationController.js

const {
  createDonation: createDonationService,
  getAllDonations,
  getDonationById: getDonationByIdService,
  cancelDonation: cancelDonationService,
  depositCashDonation,
  verifyItemDonation
} = require("../services/DonationService");

const logger = require("../utils/logger");
const buildResponse = require("../utils/response");
const DataConstant = require("../constants/DataConstant");

exports.createDonation = async (
  req,
  res
) => {
  const response =
    await createDonationService(
      req.body,
      req.body.userId
    );

  return res
    .status(200)
    .json(response);
};

exports.getAllDonations = async (req, res) => {
  try {
    const response = await getAllDonations({
      ...req.query,
    });

    return res
      .status(response.responseCode || 200)
      .json(response);
  } catch (error) {
    logger.error(
      `getAllDonations controller error: ${error.message}`
    );

    return res.status(500).json(
      buildResponse(
        DataConstant.INTERNAL_SERVER_ERROR,
        "Failed to fetch donations"
      )
    );
  }
};

exports.getDonationById = async (req, res) => {
  try {
    const response =
      await getDonationById(
        req.params.id
      );

    return res
      .status(response.responseCode || 200)
      .json(response);
  } catch (error) {
    logger.error(
      `getDonationById controller error: ${error.message}`
    );

    return res.status(500).json(
      buildResponse(
        DataConstant.INTERNAL_SERVER_ERROR,
        "Failed to fetch donation"
      )
    );
  }
};

exports.cancelDonation = async (
  req,
  res
) => {
  const response =
    await cancelDonationService(
      req.params.id,
      req.body,
      req.body.userId
    );

  return res
    .status(200)
    .json(response);
};

exports.depositCashDonation = async (
  req,
  res
) => {
  const response =
    await depositCashDonation({
      ...req.body
    });

  return res
    .status(
      response.responseCode
    )
    .json(response);
};

exports.verifyItemDonation = async (req, res)=> {
  const response = await verifyItemDonation({
    ...req.body,
    updatedBy:
      req.body.updatedBy ||
      req.user?._id ||
      req.user?.id ||
      null,
  });

  return res.status(response.responseCode).json(response);
};