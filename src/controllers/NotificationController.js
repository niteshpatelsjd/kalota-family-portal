const notificationService = require("../services/NotificationService");

async function createNotification(req, res) {
  const response = await notificationService.createNotificationService(req.body);
  return res.status(response.responseCode).json(response);
}

async function sendNotificationToUser(req, res) {
  const response = await notificationService.sendNotificationToUserService(req.body);
  return res.status(response.responseCode).json(response);
}

async function sendNotificationToAll(req, res) {
  const response = await notificationService.sendNotificationToAllService(req.body);
  return res.status(response.responseCode).json(response);
}

async function getAllNotifications(req, res) {
  const response = await notificationService.getAllNotificationsService(req.query);
  return res.status(response.responseCode).json(response);
}

async function getNotificationsByUser(req, res) {
  const response = await notificationService.getNotificationsByUserService(
    req.params.userId,
    req.query
  );
  return res.status(response.responseCode).json(response);
}

async function getNotificationById(req, res) {
  const response = await notificationService.getNotificationByIdService(req.params.id);
  return res.status(response.responseCode).json(response);
}

async function markAsRead(req, res) {
  const response = await notificationService.markAsReadService(req.params.id);
  return res.status(response.responseCode).json(response);
}

async function markAllAsRead(req, res) {
  const response = await notificationService.markAllAsReadService(req.params.userId);
  return res.status(response.responseCode).json(response);
}

async function deleteNotification(req, res) {
  const response = await notificationService.deleteNotificationService(req.params.id);
  return res.status(response.responseCode).json(response);
}

module.exports = {
  createNotification,
  sendNotificationToUser,
  sendNotificationToAll,
  getAllNotifications,
  getNotificationsByUser,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};