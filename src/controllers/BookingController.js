const bookingService = require("../services/BookingService");
const logger = require("../utils/logger");

exports.addUpdateBookingUnit = async (req, res) => {
  const response = await bookingService.addUpdateBookingUnit(req.body);
  return res.status(response.responseCode || 200).json(response);
};

exports.getAllBookingUnit = async (req, res) => {
  const response = await bookingService.getAllBookingUnit(req.query);
  return res.status(response.responseCode || 200).json(response);
};

exports.blockUnblockBookingUnit = async (req, res) => {
  const response = await bookingService.blockUnblockBookingUnit(req.body);
  return res.status(response.responseCode || 200).json(response);
};

exports.checkAvailability = async (req, res) => {
  const response = await bookingService.checkAvailability(req.query);
  return res.status(response.responseCode || 200).json(response);
};

exports.createBooking = async (req, res) => {
  logger.info("createBooking controller request", {
    body: req.body,
  });

  const response = await bookingService.createBooking(req.body);

  logger.info("createBooking controller response", {
    responseCode: response.responseCode,
    message: response.message,
    bookingId: response.responseBody?.id,
    bookingNumber: response.responseBody?.bookingNumber,
  });

  return res.status(response.responseCode || 200).json(response);
};

exports.getAllBooking = async (req, res) => {
  const response = await bookingService.getAllBooking(req.query);
  return res.status(response.responseCode || 200).json(response);
};

exports.getBookingById = async (req, res) => {
  const response = await bookingService.getBookingById(req.query);
  return res.status(response.responseCode || 200).json(response);
};

exports.approveRejectBooking = async (req, res) => {
  logger.info("approveRejectBooking controller request", {
    body: req.body,
  });

  const response = await bookingService.approveRejectBooking(req.body);

  logger.info("approveRejectBooking controller response", {
    responseCode: response.responseCode,
    message: response.message,
    bookingId: response.responseBody?.id,
    bookingNumber: response.responseBody?.bookingNumber,
    bookingStatus: response.responseBody?.bookingStatus,
    paymentStatus: response.responseBody?.paymentStatus,
  });

  return res.status(response.responseCode || 200).json(response);
};

exports.cancelBooking = async (req, res) => {
  const response = await bookingService.cancelBooking(req.body);
  return res.status(response.responseCode || 200).json(response);
};

exports.remainingBookingAmount = async (req, res) => {
  logger.info("remainingBookingAmount controller request", {
    body: req.body,
  });

  const response = await bookingService.remainingBookingAmount(req.body);

  logger.info("remainingBookingAmount controller response", {
    responseCode: response.responseCode,
    message: response.message,
    bookingId: response.responseBody?.id,
    bookingNumber: response.responseBody?.bookingNumber,
    paidAmount: response.responseBody?.paidAmount,
    balanceAmount: response.responseBody?.balanceAmount,
    paymentStatus: response.responseBody?.paymentStatus,
  });

  return res.status(response.responseCode || 200).json(response);
};

exports.blockUnblockBooking = async (req, res) => {
  const response = await bookingService.blockUnblockBooking(req.body);
  return res.status(response.responseCode || 200).json(response);
};
