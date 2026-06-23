// controllers/DonationController.js

const {
  createDonation: createDonationService,
  getAllDonations: getAllDonationsService,
  getDonationById: getDonationByIdService,
  cancelDonation: cancelDonationService,
} = require("../services/DonationService");

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

exports.getAllDonations = async (
  req,
  res
) => {
  const response =
    await getAllDonationsService(
      req.query
    );

  return res
    .status(200)
    .json(response);
};

exports.getDonationById = async (
  req,
  res
) => {
  const response =
    await getDonationByIdService(
      req.params.id
    );

  return res
    .status(200)
    .json(response);
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