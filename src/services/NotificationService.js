const Notification = require("../models/Notification");
const UserDevice = require("../models/UserDevice");
const User = require("../models/User");

const buildResponse = require("../utils/response");
const logger = require("../utils/logger");
const firebaseAdmin = require("../firebase/firebase");

const DataConstant = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

async function createNotificationService(body) {
  try {
    const {
      userId,
      title,
      message,
      type = "GENERAL",
      data = {},
      imageUrl = null,
    } = body;

    if (!userId) {
      return buildResponse(DataConstant.BAD_REQUEST, "userId is required");
    }

    if (!title) {
      return buildResponse(DataConstant.BAD_REQUEST, "title is required");
    }

    if (!message) {
      return buildResponse(DataConstant.BAD_REQUEST, "message is required");
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data,
      imageUrl,
      sentStatus: "PENDING",
    });

    return buildResponse(
      DataConstant.SUCCESS,
      "Notification created successfully",
      notification
    );
  } catch (error) {
    logger.error(`createNotificationService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to create notification"
    );
  }
}

async function sendNotificationToUserService(body) {
  try {
    const {
      userId,
      title,
      message,
      type = "GENERAL",
      data = {},
      imageUrl = null,
    } = body;

    if (!userId) {
      return buildResponse(DataConstant.BAD_REQUEST, "userId is required");
    }

    if (!title || !message) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "title and message are required"
      );
    }

    const devices = await UserDevice.find({
      userId,
      status: 1,
      deviceToken: { $ne: null },
    });

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data,
      imageUrl,
      sentStatus: "PENDING",
    });

    if (!devices.length) {
      notification.sentStatus = "FAILED";
      notification.failureReason = "No active device token found";
      await notification.save();

      return buildResponse(
        DataConstant.SUCCESS,
        "Notification stored but no active device found",
        notification
      );
    }

    const tokens = devices.map((d) => d.deviceToken);

    const payload = {
      notification: {
        title,
        body: message,
      },
      data: {
        notificationId: notification._id.toString(),
        type,
        ...convertDataToString(data),
      },
      tokens,
    };

    if (imageUrl) {
      payload.notification.imageUrl = imageUrl;
    }

    const firebaseResponse =
      await firebaseAdmin.messaging().sendEachForMulticast(payload);

    notification.sentStatus =
      firebaseResponse.successCount > 0 ? "SENT" : "FAILED";

    notification.firebaseMessageId = JSON.stringify({
      successCount: firebaseResponse.successCount,
      failureCount: firebaseResponse.failureCount,
    });

    if (firebaseResponse.failureCount > 0) {
      notification.failureReason = "Some devices failed";
    }

    await notification.save();

    return buildResponse(
      DataConstant.SUCCESS,
      "Notification sent successfully",
      {
        notification,
        firebaseResponse: {
          successCount: firebaseResponse.successCount,
          failureCount: firebaseResponse.failureCount,
        },
      }
    );
  } catch (error) {
    logger.error(`sendNotificationToUserService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to send notification"
    );
  }
}

async function sendNotificationToAllService(body) {
  try {
    const {
      title,
      message,
      type = "GENERAL",
      data = {},
      imageUrl = null,
    } = body;

    if (!title || !message) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "title and message are required"
      );
    }

    const users = await User.find({
      status: 1,
      verificationStatus: "APPROVED",
    }).select("_id");

    if (!users.length) {
      return buildResponse(DataConstant.NOT_FOUND, "No active users found");
    }

    const userIds = users.map((u) => u._id);

    const devices = await UserDevice.find({
      userId: { $in: userIds },
      status: 1,
      deviceToken: { $ne: null },
    });

    const notifications = await Notification.insertMany(
      userIds.map((userId) => ({
        userId,
        title,
        message,
        type,
        data,
        imageUrl,
        sentStatus: "PENDING",
      }))
    );

    if (!devices.length) {
      await Notification.updateMany(
        { _id: { $in: notifications.map((n) => n._id) } },
        {
          sentStatus: "FAILED",
          failureReason: "No active device tokens found",
        }
      );

      return buildResponse(
        DataConstant.SUCCESS,
        "Notifications stored but no active devices found",
        {
          totalUsers: userIds.length,
          sent: 0,
        }
      );
    }

    const tokens = devices.map((d) => d.deviceToken);

    const payload = {
      notification: {
        title,
        body: message,
      },
      data: {
        type,
        ...convertDataToString(data),
      },
      tokens,
    };

    if (imageUrl) {
      payload.notification.imageUrl = imageUrl;
    }

    const firebaseResponse =
      await firebaseAdmin.messaging().sendEachForMulticast(payload);

    await Notification.updateMany(
      { _id: { $in: notifications.map((n) => n._id) } },
      {
        sentStatus: firebaseResponse.successCount > 0 ? "SENT" : "FAILED",
        firebaseMessageId: JSON.stringify({
          successCount: firebaseResponse.successCount,
          failureCount: firebaseResponse.failureCount,
        }),
      }
    );

    return buildResponse(
      DataConstant.SUCCESS,
      "Bulk notification processed successfully",
      {
        totalUsers: userIds.length,
        totalDevices: tokens.length,
        successCount: firebaseResponse.successCount,
        failureCount: firebaseResponse.failureCount,
      }
    );
  } catch (error) {
    logger.error(`sendNotificationToAllService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to send bulk notification"
    );
  }
}

async function getAllNotificationsService(query) {
  try {
    const pageIndex = Number(query.pageIndex) || 0;
    const pageSize = Number(query.pageSize) || 10;

    const filter = {
      status: { $ne: 2 },
    };

    if (query.userId) filter.userId = query.userId;
    if (query.type) filter.type = query.type;
    if (query.sentStatus) filter.sentStatus = query.sentStatus;

    if (query.isRead !== undefined && query.isRead !== "") {
      filter.isRead = query.isRead === "true";
    }

    const totalRecords = await Notification.countDocuments(filter);

    const content = await Notification.find(filter)
      .populate("userId", "name firstName lastName mobileNumber")
      .sort({ createdAt: -1 })
      .skip(pageIndex * pageSize)
      .limit(pageSize);

    return buildResponse(
      DataConstant.SUCCESS,
      "Notifications fetched successfully",
      {
        content,
        pageIndex,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      }
    );
  } catch (error) {
    logger.error(`getAllNotificationsService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to fetch notifications"
    );
  }
}

async function getNotificationsByUserService(userId, query) {
  try {
    if (!userId) {
      return buildResponse(DataConstant.BAD_REQUEST, "userId is required");
    }

    const pageIndex = Number(query.pageIndex) || 0;
    const pageSize = Number(query.pageSize) || 10;

    const filter = {
      userId,
      status: { $ne: 2 },
    };

    if (query.isRead !== undefined && query.isRead !== "") {
      filter.isRead = query.isRead === "true";
    }

    const totalRecords = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
      status: { $ne: 2 },
    });

    const content = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(pageIndex * pageSize)
      .limit(pageSize);

    return buildResponse(
      DataConstant.SUCCESS,
      "User notifications fetched successfully",
      {
        content,
        unreadCount,
        pageIndex,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      }
    );
  } catch (error) {
    logger.error(`getNotificationsByUserService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to fetch user notifications"
    );
  }
}

async function getNotificationByIdService(id) {
  try {
    const notification = await Notification.findOne({
      _id: id,
      status: { $ne: 2 },
    })
      .populate("userId", "name firstName lastName mobileNumber")
 

    if (!notification) {
      return buildResponse(DataConstant.NOT_FOUND, "Notification not found");
    }

    return buildResponse(
      DataConstant.SUCCESS,
      "Notification fetched successfully",
      notification
    );
  } catch (error) {
    logger.error(`getNotificationByIdService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to fetch notification"
    );
  }
}

async function markAsReadService(id) {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        status: { $ne: 2 },
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return buildResponse(DataConstant.NOT_FOUND, "Notification not found");
    }

    return buildResponse(
      DataConstant.SUCCESS,
      "Notification marked as read",
      notification
    );
  } catch (error) {
    logger.error(`markAsReadService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to mark notification as read"
    );
  }
}

async function markAllAsReadService(userId) {
  try {
    if (!userId) {
      return buildResponse(DataConstant.BAD_REQUEST, "userId is required");
    }

    await Notification.updateMany(
      {
        userId,
        isRead: false,
        status: { $ne: 2 },
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return buildResponse(
      DataConstant.SUCCESS,
      "All notifications marked as read"
    );
  } catch (error) {
    logger.error(`markAllAsReadService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to mark all notifications as read"
    );
  }
}

async function deleteNotificationService(id) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        status: 2,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return buildResponse(DataConstant.NOT_FOUND, "Notification not found");
    }

    return buildResponse(
      DataConstant.SUCCESS,
      "Notification deleted successfully",
      notification
    );
  } catch (error) {
    logger.error(`deleteNotificationService error: ${error.message}`);
    return buildResponse(
      DataConstant.INTERNAL_SERVER_ERROR,
      "Failed to delete notification"
    );
  }
}

function convertDataToString(data = {}) {
  const result = {};

  Object.keys(data).forEach((key) => {
    result[key] =
      typeof data[key] === "string"
        ? data[key]
        : JSON.stringify(data[key]);
  });

  return result;
}

module.exports = {
  createNotificationService,
  sendNotificationToUserService,
  sendNotificationToAllService,
  getAllNotificationsService,
  getNotificationsByUserService,
  getNotificationByIdService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
};