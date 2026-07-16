const bookingService = require("../services/BookingService");

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
  const response = await bookingService.createBooking(req.body);
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
  const response = await bookingService.approveRejectBooking(req.body);
  return res.status(response.responseCode || 200).json(response);
};

exports.cancelBooking = async (req, res) => {
  const response = await bookingService.cancelBooking(req.body);
  return res.status(response.responseCode || 200).json(response);
};

exports.blockUnblockBooking = async (req, res) => {
  const response = await bookingService.blockUnblockBooking(req.body);
  return res.status(response.responseCode || 200).json(response);
};
