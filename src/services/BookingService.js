const mongoose = require("mongoose");

const Dharamshala = require("../models/Dharamshala");
const DharamshalaBookingUnit = require("../models/DharamshalaBookingUnit");
const DharamshalaBooking = require("../models/DharamshalaBooking");
const User = require("../models/User");
const buildResponse = require("../utils/response");
const logger = require("../utils/logger");
const {
  sendNotificationToUserService,
} = require("./NotificationService");

const UNIT_TYPES = [
  "ROOM",
  "HALL",
  "KITCHEN",
  "DINING",
  "GROUND",
  "FULL_DHARAMSHALA",
  "OTHER",
];

const BOOKING_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  CANCELLED: 4,
  COMPLETED: 5,
};

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function toNumber(value, defaultValue = 0) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? defaultValue : numericValue;
}

function parseDateOnly(dateStr, endOfDay = false) {
  if (!dateStr) return null;

  const [day, month, year] = String(dateStr).split("-");

  if (!day || !month || !year) return null;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function formatDate(date) {
  if (!date) return null;

  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");

  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function bookingStatusLabel(status) {
  if (status === 1) return "Pending";
  if (status === 2) return "Approved";
  if (status === 3) return "Rejected";
  if (status === 4) return "Cancelled";
  if (status === 5) return "Completed";
  return "";
}

function paymentStatusLabel(status) {
  if (status === 1) return "Unpaid";
  if (status === 2) return "Partially Paid";
  if (status === 3) return "Paid";
  if (status === 4) return "Refunded";
  return "";
}

function getActionUserResponse(actionBy) {
  if (!actionBy || !actionBy._id) return null;

  return {
    id: actionBy._id,
    name: getUserDisplayName(actionBy),
    profileImage: actionBy.profileImage || actionBy.profileUrl || null,
    profileUrl: actionBy.profileUrl || null,
  };
}

function getUserDisplayName(user) {
  if (!user) return "";

  return (
    user.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    ""
  );
}

function mapUnitResponse(unit) {
  if (!unit) return null;

  const dharamshala = unit.dharamshalaId;

  return {
    id: unit._id,
    dharamshalaId: dharamshala?._id || unit.dharamshalaId,
    dharamshalaResponse:
      dharamshala && dharamshala._id
        ? {
            id: dharamshala._id,
            name: dharamshala.name || "",
            type: dharamshala.type || "",
            address: dharamshala.address || "",
            bannerImage: dharamshala.bannerImage || null,
          }
        : null,
    unitName: unit.unitName,
    unitType: unit.unitType,
    capacity: unit.capacity || 0,
    totalUnits: unit.totalUnits || 1,
    basePrice: unit.basePrice || 0,
    securityDeposit: unit.securityDeposit || 0,
    description: unit.description || "",
    status: unit.status,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };
}

function mapBookingResponse(booking) {
  if (!booking) return null;

  const user = booking.userId;
  const unit = booking.unitId;
  const dharamshala = booking.dharamshalaId;

  return {
    id: booking._id,
    bookingNumber: booking.bookingNumber,
    dharamshalaId: dharamshala?._id || booking.dharamshalaId,
    dharamshalaResponse:
      dharamshala && dharamshala._id
        ? {
            id: dharamshala._id,
            name: dharamshala.name || "",
            type: dharamshala.type || "",
            address: dharamshala.address || "",
            bannerImage: dharamshala.bannerImage || null,
          }
        : null,
    unitId: unit?._id || booking.unitId,
    unitResponse:
      unit && unit._id
        ? {
            id: unit._id,
            unitName: unit.unitName || "",
            unitType: unit.unitType || "",
            capacity: unit.capacity || 0,
            totalUnits: unit.totalUnits || 1,
            basePrice: unit.basePrice || 0,
            securityDeposit: unit.securityDeposit || 0,
          }
        : null,
    userId: user?._id || booking.userId,
    userResponse:
      user && user._id
        ? {
            id: user._id,
            name: getUserDisplayName(user),
            mobileNumber: user.mobileNumber || "",
            profileUrl: user.profileUrl || null,
            familyId: user.familyId || booking.familyId || "",
          }
        : null,
    familyId: booking.familyId || "",
    eventType: booking.eventType || "",
    bookingFromDate: formatDate(booking.bookingFromDate),
    bookingToDate: formatDate(booking.bookingToDate),
    checkInTime: booking.checkInTime || "",
    checkOutTime: booking.checkOutTime || "",
    guestCount: booking.guestCount || 0,
    purpose: booking.purpose || "",
    bookingAmount: booking.bookingAmount || 0,
    securityDeposit: booking.securityDeposit || 0,
    totalAmount: booking.totalAmount || 0,
    paidAmount: booking.paidAmount || 0,
    balanceAmount: booking.balanceAmount || 0,
    bookingStatus: booking.bookingStatus,
    bookingStatusLabel: bookingStatusLabel(booking.bookingStatus),
    paymentStatus: booking.paymentStatus,
    paymentStatusLabel: paymentStatusLabel(booking.paymentStatus),
    status: booking.status,
    actionBy: getActionUserResponse(booking.actionBy),
    actionAt: booking.actionAt || null,
    actionType: booking.actionType || "",
    actionDescriptions: booking.actionDescriptions || "",
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

async function generateBookingNumber() {
  const year = new Date().getFullYear();
  const prefix = `BK-${year}-`;

  const latestBooking = await DharamshalaBooking.findOne({
    bookingNumber: {
      $regex: `^${prefix}`,
    },
  })
    .sort({ createdAt: -1 })
    .select("bookingNumber")
    .lean();

  const latestSequence = latestBooking?.bookingNumber
    ? Number(latestBooking.bookingNumber.replace(prefix, ""))
    : 0;

  const nextSequence = Number.isNaN(latestSequence)
    ? 1
    : latestSequence + 1;

  return `${prefix}${String(nextSequence).padStart(5, "0")}`;
}

async function validateDharamshalaAndUnit({ dharamshalaId, unitId }) {
  if (!dharamshalaId || !isValidObjectId(dharamshalaId)) {
    return {
      valid: false,
      response: buildResponse(400, "Valid dharamshalaId is required", null),
    };
  }

  const dharamshala = await Dharamshala.findOne({
    _id: dharamshalaId,
    status: { $ne: 0 },
  });

  if (!dharamshala) {
    return {
      valid: false,
      response: buildResponse(404, "Dharamshala not found", null),
    };
  }

  if (unitId) {
    if (!isValidObjectId(unitId)) {
      return {
        valid: false,
        response: buildResponse(400, "Invalid unitId", null),
      };
    }

    const unit = await DharamshalaBookingUnit.findOne({
      _id: unitId,
      dharamshalaId,
      status: 1,
    });

    if (!unit) {
      return {
        valid: false,
        response: buildResponse(404, "Booking unit not found", null),
      };
    }

    return {
      valid: true,
      dharamshala,
      unit,
    };
  }

  return {
    valid: true,
    dharamshala,
  };
}

async function findOverlappingApprovedBooking({
  unitId,
  fromDate,
  toDate,
  excludeBookingId = null,
}) {
  const query = {
    unitId,
    status: 1,
    bookingStatus: BOOKING_STATUS.APPROVED,
    bookingFromDate: { $lte: toDate },
    bookingToDate: { $gte: fromDate },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return await DharamshalaBooking.findOne(query).lean();
}

async function countOverlappingApprovedBookings({
  unitId,
  fromDate,
  toDate,
  excludeBookingId = null,
}) {
  const query = {
    unitId,
    status: 1,
    bookingStatus: BOOKING_STATUS.APPROVED,
    bookingFromDate: { $lte: toDate },
    bookingToDate: { $gte: fromDate },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return await DharamshalaBooking.countDocuments(query);
}

async function countOverlappingApprovedBookingsForDharamshala({
  dharamshalaId,
  fromDate,
  toDate,
  excludeBookingId = null,
}) {
  const query = {
    dharamshalaId,
    status: 1,
    bookingStatus: BOOKING_STATUS.APPROVED,
    bookingFromDate: { $lte: toDate },
    bookingToDate: { $gte: fromDate },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return await DharamshalaBooking.countDocuments(query);
}

async function countOverlappingFullDharamshalaBookings({
  dharamshalaId,
  fromDate,
  toDate,
  excludeBookingId = null,
}) {
  const fullDharamshalaUnits = await DharamshalaBookingUnit.find({
    dharamshalaId,
    unitType: "FULL_DHARAMSHALA",
    status: 1,
  })
    .select("_id")
    .lean();

  const fullDharamshalaUnitIds = fullDharamshalaUnits.map((unit) => unit._id);

  if (!fullDharamshalaUnitIds.length) {
    return 0;
  }

  const query = {
    dharamshalaId,
    unitId: { $in: fullDharamshalaUnitIds },
    status: 1,
    bookingStatus: BOOKING_STATUS.APPROVED,
    bookingFromDate: { $lte: toDate },
    bookingToDate: { $gte: fromDate },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return await DharamshalaBooking.countDocuments(query);
}

async function sendBookingNotification({ booking, title, message, type }) {
  try {
    if (!booking?.userId) return;

    await sendNotificationToUserService({
      userId: booking.userId,
      title,
      message,
      type,
      data: {
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingNumber,
      },
    });
  } catch (error) {
    logger.error("Booking notification failed", {
      error: error.message,
      stack: error.stack,
      bookingId: booking?._id,
    });
  }
}

async function addUpdateBookingUnit(data) {
  try {
    const {
      id,
      dharamshalaId,
      unitName,
      unitType,
      capacity,
      totalUnits,
      basePrice,
      securityDeposit,
      description,
      createdBy,
      updatedBy,
    } = data;

    if (!unitName || !String(unitName).trim()) {
      return buildResponse(400, "unitName is required", null);
    }

    const normalizedUnitType = String(unitType || "").toUpperCase();

    if (!UNIT_TYPES.includes(normalizedUnitType)) {
      return buildResponse(400, "Invalid unitType", null);
    }

    const validation = await validateDharamshalaAndUnit({ dharamshalaId });
    if (!validation.valid) return validation.response;

    const payload = {
      dharamshalaId,
      unitName: String(unitName).trim(),
      unitType: normalizedUnitType,
      capacity: toNumber(capacity),
      totalUnits: Math.max(1, toNumber(totalUnits, 1)),
      basePrice: toNumber(basePrice),
      securityDeposit: toNumber(securityDeposit),
      description: description || "",
      updatedBy: updatedBy || createdBy || null,
    };

    if (id) {
      if (!isValidObjectId(id)) {
        return buildResponse(400, "Invalid id", null);
      }

      const unit = await DharamshalaBookingUnit.findByIdAndUpdate(
        id,
        payload,
        { new: true }
      ).populate("dharamshalaId", "name type address bannerImage");

      if (!unit) {
        return buildResponse(404, "Booking unit not found", null);
      }

      return buildResponse(
        200,
        "Booking unit updated successfully",
        mapUnitResponse(unit)
      );
    }

    payload.createdBy = createdBy || null;

    const unit = await DharamshalaBookingUnit.create(payload);
    await unit.populate("dharamshalaId", "name type address bannerImage");

    return buildResponse(
      200,
      "Booking unit created successfully",
      mapUnitResponse(unit)
    );
  } catch (error) {
    logger.error("addUpdateBookingUnit error", {
      error: error.message,
      stack: error.stack,
      data,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function getAllBookingUnit(query) {
  try {
    const {
      dharamshalaId,
      unitType,
      status,
      searchText,
      pageIndex = 0,
      pageSize = 10,
    } = query;

    const page = Math.max(Number(pageIndex) || 0, 0);
    const limit = Math.max(Number(pageSize) || 10, 1);
    const filter = {};

    if (dharamshalaId) {
      if (!isValidObjectId(dharamshalaId)) {
        return buildResponse(400, "Invalid dharamshalaId", null);
      }
      filter.dharamshalaId = dharamshalaId;
    }

    if (unitType) {
      const normalizedUnitType = String(unitType).toUpperCase();
      if (!UNIT_TYPES.includes(normalizedUnitType)) {
        return buildResponse(400, "Invalid unitType", null);
      }
      filter.unitType = normalizedUnitType;
    }

    if (status !== undefined && status !== null && status !== "") {
      const numericStatus = Number(status);
      if (![0, 1, 2].includes(numericStatus)) {
        return buildResponse(400, "status must be 0, 1 or 2", null);
      }
      filter.status = numericStatus;
    }

    if (searchText) {
      const regex = new RegExp(String(searchText).trim(), "i");
      filter.$or = [{ unitName: regex }, { description: regex }];
    }

    const [units, totalRecords] = await Promise.all([
      DharamshalaBookingUnit.find(filter)
        .populate("dharamshalaId", "name type address bannerImage")
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit),
      DharamshalaBookingUnit.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return buildResponse(200, "Booking units fetched successfully", {
      content: units.map(mapUnitResponse),
      pageIndex: page,
      pageSize: limit,
      totalRecords,
      totalPages,
      isLast: page + 1 >= totalPages,
      hasNext: page + 1 < totalPages,
      hasPrevious: page > 0,
    });
  } catch (error) {
    logger.error("getAllBookingUnit error", {
      error: error.message,
      stack: error.stack,
      query,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function blockUnblockBookingUnit({ id, status }) {
  try {
    if (!id || !isValidObjectId(id)) {
      return buildResponse(400, "Valid id is required", null);
    }

    if (status === undefined || status === null || status === "") {
      return buildResponse(400, "status is required", null);
    }

    const numericStatus = Number(status);
    if (![0, 1, 2].includes(numericStatus)) {
      return buildResponse(400, "status must be 0, 1 or 2", null);
    }

    const unit = await DharamshalaBookingUnit.findById(id);
    if (!unit) {
      return buildResponse(404, "Booking unit not found", null);
    }

    if (unit.status === numericStatus) {
      return buildResponse(400, "Booking unit already has same status", null);
    }

    unit.status = numericStatus;
    await unit.save();

    const message =
      numericStatus === 0
        ? "Booking unit deleted successfully"
        : numericStatus === 1
          ? "Booking unit activated successfully"
          : "Booking unit blocked successfully";

    return buildResponse(200, message, unit);
  } catch (error) {
    logger.error("blockUnblockBookingUnit error", {
      error: error.message,
      stack: error.stack,
      id,
      status,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function checkAvailability(query) {
  try {
    const { dharamshalaId, unitId, fromDate, toDate } = query;

    if (!unitId || !isValidObjectId(unitId)) {
      return buildResponse(400, "Valid unitId is required", null);
    }

    const validation = await validateDharamshalaAndUnit({
      dharamshalaId,
      unitId,
    });
    if (!validation.valid) return validation.response;

    const parsedFromDate = parseDateOnly(fromDate);
    const parsedToDate = parseDateOnly(toDate, true);

    if (!parsedFromDate) {
      return buildResponse(400, "fromDate must be in dd-MM-yyyy format", null);
    }

    if (!parsedToDate) {
      return buildResponse(400, "toDate must be in dd-MM-yyyy format", null);
    }

    if (parsedFromDate > parsedToDate) {
      return buildResponse(400, "fromDate cannot be after toDate", null);
    }

    if (validation.unit.unitType === "FULL_DHARAMSHALA") {
      const overlappingDharamshalaBookings =
        await countOverlappingApprovedBookingsForDharamshala({
          dharamshalaId,
          fromDate: parsedFromDate,
          toDate: parsedToDate,
        });

      return buildResponse(200, "Availability checked successfully", {
        isAvailable: overlappingDharamshalaBookings === 0,
        totalUnits: 1,
        bookedUnits: overlappingDharamshalaBookings > 0 ? 1 : 0,
        availableUnits: overlappingDharamshalaBookings === 0 ? 1 : 0,
        reason:
          overlappingDharamshalaBookings > 0
            ? "FULL_DHARAMSHALA_DATE_OCCUPIED"
            : "",
      });
    }

    const fullDharamshalaBookings =
      await countOverlappingFullDharamshalaBookings({
        dharamshalaId,
        fromDate: parsedFromDate,
        toDate: parsedToDate,
      });

    if (fullDharamshalaBookings > 0) {
      return buildResponse(200, "Availability checked successfully", {
        isAvailable: false,
        totalUnits: Math.max(1, Number(validation.unit.totalUnits || 1)),
        bookedUnits: Math.max(1, Number(validation.unit.totalUnits || 1)),
        availableUnits: 0,
        reason: "FULL_DHARAMSHALA_DATE_OCCUPIED",
      });
    }

    const bookedUnits = await countOverlappingApprovedBookings({
      unitId,
      fromDate: parsedFromDate,
      toDate: parsedToDate,
    });
    const totalUnits = Math.max(1, Number(validation.unit.totalUnits || 1));
    const availableUnits = Math.max(0, totalUnits - bookedUnits);

    return buildResponse(200, "Availability checked successfully", {
      isAvailable: availableUnits > 0,
      totalUnits,
      bookedUnits,
      availableUnits,
    });
  } catch (error) {
    logger.error("checkAvailability error", {
      error: error.message,
      stack: error.stack,
      query,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function createBooking(data) {
  try {
    const {
      dharamshalaId,
      unitId,
      userId,
      eventType,
      fromDate,
      toDate,
      bookingFromDate,
      bookingToDate,
      checkInTime,
      checkOutTime,
      guestCount,
      purpose,
      bookingAmount,
      securityDeposit,
      createdBy,
    } = data;

    logger.info("createBooking request received", {
      dharamshalaId,
      unitId,
      userId,
      eventType,
      bookingFromDate: bookingFromDate || fromDate,
      bookingToDate: bookingToDate || toDate,
      guestCount,
      bookingAmount,
      securityDeposit,
    });

    if (!userId || !isValidObjectId(userId)) {
      logger.warn("createBooking validation failed", {
        reason: "INVALID_USER_ID",
        userId,
      });
      return buildResponse(400, "Valid userId is required", null);
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn("createBooking validation failed", {
        reason: "USER_NOT_FOUND",
        userId,
      });
      return buildResponse(404, "User not found", null);
    }

    const validation = await validateDharamshalaAndUnit({
      dharamshalaId,
      unitId,
    });
    if (!validation.valid) {
      logger.warn("createBooking validation failed", {
        reason: "DHARAMSHALA_OR_UNIT_INVALID",
        dharamshalaId,
        unitId,
        message: validation.response?.message,
      });
      return validation.response;
    }

    const parsedFromDate = parseDateOnly(bookingFromDate || fromDate);
    const parsedToDate = parseDateOnly(bookingToDate || toDate, true);

    if (!parsedFromDate) {
      logger.warn("createBooking validation failed", {
        reason: "INVALID_FROM_DATE",
        bookingFromDate: bookingFromDate || fromDate,
      });
      return buildResponse(
        400,
        "bookingFromDate/fromDate must be in dd-MM-yyyy format",
        null
      );
    }

    if (!parsedToDate) {
      logger.warn("createBooking validation failed", {
        reason: "INVALID_TO_DATE",
        bookingToDate: bookingToDate || toDate,
      });
      return buildResponse(
        400,
        "bookingToDate/toDate must be in dd-MM-yyyy format",
        null
      );
    }

    if (parsedFromDate > parsedToDate) {
      logger.warn("createBooking validation failed", {
        reason: "FROM_DATE_AFTER_TO_DATE",
        bookingFromDate: bookingFromDate || fromDate,
        bookingToDate: bookingToDate || toDate,
      });
      return buildResponse(400, "bookingFromDate cannot be after bookingToDate", null);
    }

    const bookingTotalAmount =
      toNumber(bookingAmount, validation.unit.basePrice || 0) +
      toNumber(securityDeposit, validation.unit.securityDeposit || 0);

    const booking = await DharamshalaBooking.create({
      bookingNumber: await generateBookingNumber(),
      dharamshalaId,
      unitId,
      userId,
      familyId: user.familyId || "",
      eventType: eventType || "OTHER",
      bookingFromDate: parsedFromDate,
      bookingToDate: parsedToDate,
      checkInTime: checkInTime || "",
      checkOutTime: checkOutTime || "",
      guestCount: toNumber(guestCount),
      purpose: purpose || "",
      bookingAmount: toNumber(bookingAmount, validation.unit.basePrice || 0),
      securityDeposit: toNumber(
        securityDeposit,
        validation.unit.securityDeposit || 0
      ),
      totalAmount: bookingTotalAmount,
      paidAmount: 0,
      balanceAmount: bookingTotalAmount,
      bookingStatus: BOOKING_STATUS.PENDING,
      paymentStatus: 1,
      createdBy: createdBy || userId,
    });

    await sendBookingNotification({
      booking,
      title: "Booking request created",
      message: `Your booking request ${booking.bookingNumber} has been created`,
      type: "BOOKING_CREATED",
    });

    const populatedBooking = await getBookingDocumentById(booking._id);

    logger.info("createBooking completed successfully", {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      dharamshalaId,
      unitId,
      userId,
      totalAmount: booking.totalAmount,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
    });

    return buildResponse(
      200,
      "Booking created successfully",
      mapBookingResponse(populatedBooking)
    );
  } catch (error) {
    logger.error("createBooking error", {
      error: error.message,
      stack: error.stack,
      data,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function getBookingDocumentById(id) {
  return await DharamshalaBooking.findById(id)
    .populate("dharamshalaId", "name type address bannerImage")
    .populate("unitId", "unitName unitType capacity totalUnits basePrice securityDeposit")
    .populate("userId", "name firstName lastName mobileNumber profileUrl familyId")
    .populate("actionBy", "name firstName lastName profileImage profileUrl");
}

async function getAllBooking(query) {
  try {
    const {
      dharamshalaId,
      unitId,
      userId,
      familyId,
      bookingStatus,
      paymentStatus,
      status,
      startDate,
      endDate,
      searchText,
      pageIndex = 0,
      pageSize = 10,
    } = query;

    const page = Math.max(Number(pageIndex) || 0, 0);
    const limit = Math.max(Number(pageSize) || 10, 1);
    const filter = {};

    if (dharamshalaId) {
      if (!isValidObjectId(dharamshalaId)) {
        return buildResponse(400, "Invalid dharamshalaId", null);
      }
      filter.dharamshalaId = dharamshalaId;
    }

    if (unitId) {
      if (!isValidObjectId(unitId)) {
        return buildResponse(400, "Invalid unitId", null);
      }
      filter.unitId = unitId;
    }

    if (userId) {
      if (!isValidObjectId(userId)) {
        return buildResponse(400, "Invalid userId", null);
      }
      filter.userId = userId;
    }

    if (familyId) filter.familyId = familyId;

    if (bookingStatus !== undefined && bookingStatus !== null && bookingStatus !== "") {
      const numericBookingStatus = Number(bookingStatus);
      if (![1, 2, 3, 4, 5].includes(numericBookingStatus)) {
        return buildResponse(400, "bookingStatus must be 1, 2, 3, 4 or 5", null);
      }
      filter.bookingStatus = numericBookingStatus;
    }

    if (paymentStatus !== undefined && paymentStatus !== null && paymentStatus !== "") {
      const numericPaymentStatus = Number(paymentStatus);
      if (![1, 2, 3, 4].includes(numericPaymentStatus)) {
        return buildResponse(400, "paymentStatus must be 1, 2, 3 or 4", null);
      }
      filter.paymentStatus = numericPaymentStatus;
    }

    if (status !== undefined && status !== null && status !== "") {
      const numericStatus = Number(status);
      if (![0, 1, 2].includes(numericStatus)) {
        return buildResponse(400, "status must be 0, 1 or 2", null);
      }
      filter.status = numericStatus;
    }

    const dateFilter = {};
    if (startDate) {
      const parsedStartDate = parseDateOnly(startDate);
      if (!parsedStartDate) {
        return buildResponse(400, "startDate must be in dd-MM-yyyy format", null);
      }
      dateFilter.$gte = parsedStartDate;
    }

    if (endDate) {
      const parsedEndDate = parseDateOnly(endDate, true);
      if (!parsedEndDate) {
        return buildResponse(400, "endDate must be in dd-MM-yyyy format", null);
      }
      dateFilter.$lte = parsedEndDate;
    }

    if (Object.keys(dateFilter).length) {
      filter.bookingFromDate = dateFilter;
    }

    if (searchText) {
      const regex = new RegExp(String(searchText).trim(), "i");
      const matchedUsers = await User.find({
        $or: [
          { name: regex },
          { firstName: regex },
          { lastName: regex },
          { mobileNumber: regex },
        ],
      })
        .select("_id")
        .lean();

      filter.$or = [
        { bookingNumber: regex },
        { eventType: regex },
        { purpose: regex },
      ];

      if (matchedUsers.length) {
        filter.$or.push({
          userId: { $in: matchedUsers.map((item) => item._id) },
        });
      }
    }

    const [bookings, totalRecords] = await Promise.all([
      DharamshalaBooking.find(filter)
        .populate("dharamshalaId", "name type address bannerImage")
        .populate("unitId", "unitName unitType capacity totalUnits basePrice securityDeposit")
        .populate("userId", "name firstName lastName mobileNumber profileUrl familyId")
        .populate("actionBy", "name firstName lastName profileImage profileUrl")
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit),
      DharamshalaBooking.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return buildResponse(200, "Bookings fetched successfully", {
      content: bookings.map(mapBookingResponse),
      pageIndex: page,
      pageSize: limit,
      totalRecords,
      totalPages,
      isLast: page + 1 >= totalPages,
      hasNext: page + 1 < totalPages,
      hasPrevious: page > 0,
    });
  } catch (error) {
    logger.error("getAllBooking error", {
      error: error.message,
      stack: error.stack,
      query,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function getBookingById({ id }) {
  try {
    if (!id || !isValidObjectId(id)) {
      return buildResponse(400, "Valid id is required", null);
    }

    const booking = await getBookingDocumentById(id);

    if (!booking) {
      return buildResponse(404, "Booking not found", null);
    }

    return buildResponse(
      200,
      "Booking fetched successfully",
      mapBookingResponse(booking)
    );
  } catch (error) {
    logger.error("getBookingById error", {
      error: error.message,
      stack: error.stack,
      id,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function approveRejectBooking(data) {
  try {
    const {
      bookingId,
      action,
      actionBy,
      actionDescriptions,
      actionDescription,
      approvedBy,
      rejectedBy,
      remark,
      paymentType,
      paymentOption,
      paidAmount,
    } = data;

    logger.info("approveRejectBooking request received", {
      bookingId,
      action,
      actionBy,
      approvedBy,
      rejectedBy,
      paymentType,
      paymentOption,
      paidAmount,
    });

    if (!bookingId || !isValidObjectId(bookingId)) {
      logger.warn("approveRejectBooking validation failed", {
        reason: "INVALID_BOOKING_ID",
        bookingId,
      });
      return buildResponse(400, "Valid bookingId is required", null);
    }

    const normalizedAction = String(action || "").toUpperCase();
    const finalActionBy = actionBy || approvedBy || rejectedBy;
    const finalActionDescriptions =
      actionDescriptions || actionDescription || remark || "";

    if (!["APPROVE", "REJECT"].includes(normalizedAction)) {
      logger.warn("approveRejectBooking validation failed", {
        reason: "INVALID_ACTION",
        bookingId,
        action,
      });
      return buildResponse(400, "action must be APPROVE or REJECT", null);
    }

    if (!finalActionBy || !isValidObjectId(finalActionBy)) {
      logger.warn("approveRejectBooking validation failed", {
        reason: "INVALID_ACTION_BY",
        bookingId,
        actionBy: finalActionBy,
      });
      return buildResponse(400, "Valid actionBy is required", null);
    }

    if (normalizedAction === "REJECT" && !String(finalActionDescriptions).trim()) {
      logger.warn("approveRejectBooking validation failed", {
        reason: "REJECT_DESCRIPTION_REQUIRED",
        bookingId,
      });
      return buildResponse(400, "actionDescriptions is required for rejection", null);
    }

    const booking = await DharamshalaBooking.findOne({
      _id: bookingId,
      status: 1,
    });

    if (!booking) {
      logger.warn("approveRejectBooking validation failed", {
        reason: "BOOKING_NOT_FOUND",
        bookingId,
      });
      return buildResponse(404, "Booking not found", null);
    }

    if (booking.bookingStatus !== BOOKING_STATUS.PENDING) {
      logger.warn("approveRejectBooking business validation failed", {
        reason: "BOOKING_NOT_PENDING",
        bookingId,
        bookingNumber: booking.bookingNumber,
        currentBookingStatus: booking.bookingStatus,
      });
      return buildResponse(400, "Only pending booking can be approved or rejected", null);
    }

    if (normalizedAction === "APPROVE") {
      const totalAmount = Number(booking.totalAmount || 0);
      const minimumPayableAmount =
        Number(booking.securityDeposit || 0) > 0
          ? Number(booking.securityDeposit || 0)
          : totalAmount;
      const normalizedPaymentType = String(paymentType || paymentOption || "")
        .toUpperCase()
        .trim();
      let finalPaidAmount = paidAmount !== undefined && paidAmount !== null && paidAmount !== ""
        ? Number(paidAmount)
        : null;

      if (!normalizedPaymentType && finalPaidAmount === null) {
        logger.warn("approveRejectBooking payment validation failed", {
          reason: "PAYMENT_TYPE_REQUIRED",
          bookingId,
          bookingNumber: booking.bookingNumber,
          minimumPayableAmount,
          fullPayableAmount: totalAmount,
        });
        return buildResponse(
          400,
          "paymentType is required for approval. Use MINIMUM or FULL",
          {
            minimumPayableAmount,
            fullPayableAmount: totalAmount,
          }
        );
      }

      if (
        normalizedPaymentType &&
        !["MINIMUM", "FULL"].includes(normalizedPaymentType)
      ) {
        logger.warn("approveRejectBooking payment validation failed", {
          reason: "INVALID_PAYMENT_TYPE",
          bookingId,
          bookingNumber: booking.bookingNumber,
          paymentType: normalizedPaymentType,
        });
        return buildResponse(400, "paymentType must be MINIMUM or FULL", null);
      }

      if (normalizedPaymentType === "MINIMUM") {
        finalPaidAmount = minimumPayableAmount;
      }

      if (normalizedPaymentType === "FULL") {
        finalPaidAmount = totalAmount;
      }

      if (!Number.isFinite(finalPaidAmount) || finalPaidAmount <= 0) {
        logger.warn("approveRejectBooking payment validation failed", {
          reason: "INVALID_PAID_AMOUNT",
          bookingId,
          bookingNumber: booking.bookingNumber,
          paidAmount: finalPaidAmount,
        });
        return buildResponse(400, "Valid paidAmount is required for approval", null);
      }

      if (finalPaidAmount < minimumPayableAmount) {
        logger.warn("approveRejectBooking payment validation failed", {
          reason: "PAID_AMOUNT_LESS_THAN_MINIMUM",
          bookingId,
          bookingNumber: booking.bookingNumber,
          paidAmount: finalPaidAmount,
          minimumPayableAmount,
        });
        return buildResponse(
          400,
          `Minimum payable amount is ${minimumPayableAmount}`,
          {
            minimumPayableAmount,
            fullPayableAmount: totalAmount,
          }
        );
      }

      if (finalPaidAmount > totalAmount) {
        logger.warn("approveRejectBooking payment validation failed", {
          reason: "PAID_AMOUNT_GREATER_THAN_TOTAL",
          bookingId,
          bookingNumber: booking.bookingNumber,
          paidAmount: finalPaidAmount,
          totalAmount,
        });
        return buildResponse(400, "paidAmount cannot be greater than totalAmount", {
          fullPayableAmount: totalAmount,
        });
      }

      const unit = await DharamshalaBookingUnit.findById(booking.unitId).select("totalUnits unitName unitType");

      if (unit?.unitType === "FULL_DHARAMSHALA") {
        const overlappingDharamshalaBookings =
          await countOverlappingApprovedBookingsForDharamshala({
            dharamshalaId: booking.dharamshalaId,
            fromDate: booking.bookingFromDate,
            toDate: booking.bookingToDate,
            excludeBookingId: booking._id,
          });

        if (overlappingDharamshalaBookings > 0) {
          logger.warn("approveRejectBooking business validation failed", {
            reason: "FULL_DHARAMSHALA_DATE_OCCUPIED",
            bookingId,
            bookingNumber: booking.bookingNumber,
            dharamshalaId: booking.dharamshalaId,
            overlappingDharamshalaBookings,
          });

          return buildResponse(
            400,
            "Full Dharamshala cannot be booked because selected date is occupied",
            {
              reason: "FULL_DHARAMSHALA_DATE_OCCUPIED",
              totalUnits: 1,
              bookedUnits: 1,
              availableUnits: 0,
            }
          );
        }
      } else {
        const fullDharamshalaBookings =
          await countOverlappingFullDharamshalaBookings({
            dharamshalaId: booking.dharamshalaId,
            fromDate: booking.bookingFromDate,
            toDate: booking.bookingToDate,
            excludeBookingId: booking._id,
          });

        if (fullDharamshalaBookings > 0) {
          logger.warn("approveRejectBooking business validation failed", {
            reason: "FULL_DHARAMSHALA_DATE_OCCUPIED",
            bookingId,
            bookingNumber: booking.bookingNumber,
            dharamshalaId: booking.dharamshalaId,
            fullDharamshalaBookings,
          });

          return buildResponse(
            400,
            "Selected date is occupied because full Dharamshala is already booked",
            {
              reason: "FULL_DHARAMSHALA_DATE_OCCUPIED",
              totalUnits: Math.max(1, Number(unit?.totalUnits || 1)),
              bookedUnits: Math.max(1, Number(unit?.totalUnits || 1)),
              availableUnits: 0,
            }
          );
        }
      }

      const totalUnits = Math.max(1, Number(unit?.totalUnits || 1));
      const bookedUnits = await countOverlappingApprovedBookings({
        unitId: booking.unitId,
        fromDate: booking.bookingFromDate,
        toDate: booking.bookingToDate,
        excludeBookingId: booking._id,
      });
      const availableUnits = Math.max(0, totalUnits - bookedUnits);

      if (availableUnits <= 0) {
        logger.warn("approveRejectBooking business validation failed", {
          reason: "NO_AVAILABLE_UNITS",
          bookingId,
          bookingNumber: booking.bookingNumber,
          unitId: booking.unitId,
          totalUnits,
          bookedUnits,
        });
        return buildResponse(400, "Booking unit is already booked for selected dates", {
          totalUnits,
          bookedUnits,
          availableUnits,
        });
      }

      booking.bookingStatus = BOOKING_STATUS.APPROVED;
      booking.paidAmount = finalPaidAmount;
      booking.balanceAmount = Math.max(0, totalAmount - finalPaidAmount);
      booking.paymentStatus = booking.balanceAmount > 0 ? 2 : 3;
      booking.actionBy = finalActionBy;
      booking.actionAt = new Date();
      booking.actionType = "APPROVED";
      booking.actionDescriptions =
        finalActionDescriptions ||
        (booking.balanceAmount > 0
          ? "Booking approved with minimum payment"
          : "Booking approved with full payment");
      await booking.save();

      await sendBookingNotification({
        booking,
        title: "Booking approved",
        message: `Your booking ${booking.bookingNumber} has been approved`,
        type: "BOOKING_APPROVED",
      });

      logger.info("approveRejectBooking approve completed", {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        actionBy: finalActionBy,
        paidAmount: booking.paidAmount,
        balanceAmount: booking.balanceAmount,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
      });
    } else {
      booking.bookingStatus = BOOKING_STATUS.REJECTED;
      booking.actionBy = finalActionBy;
      booking.actionAt = new Date();
      booking.actionType = "REJECTED";
      booking.actionDescriptions = finalActionDescriptions;
      await booking.save();

      await sendBookingNotification({
        booking,
        title: "Booking rejected",
        message: `Your booking ${booking.bookingNumber} has been rejected`,
        type: "BOOKING_REJECTED",
      });

      logger.info("approveRejectBooking reject completed", {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        actionBy: finalActionBy,
        actionDescriptions: booking.actionDescriptions,
        bookingStatus: booking.bookingStatus,
      });
    }

    const populatedBooking = await getBookingDocumentById(booking._id);

    return buildResponse(
      200,
      normalizedAction === "APPROVE"
        ? "Booking approved successfully"
        : "Booking rejected successfully",
      mapBookingResponse(populatedBooking)
    );
  } catch (error) {
    logger.error("approveRejectBooking error", {
      error: error.message,
      stack: error.stack,
      data,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function cancelBooking(data) {
  try {
    const {
      bookingId,
      actionBy,
      actionDescriptions,
      actionDescription,
      cancelledBy,
      cancelReason,
    } = data;

    if (!bookingId || !isValidObjectId(bookingId)) {
      return buildResponse(400, "Valid bookingId is required", null);
    }

    const booking = await DharamshalaBooking.findOne({
      _id: bookingId,
      status: 1,
    });

    if (!booking) {
      return buildResponse(404, "Booking not found", null);
    }

    const finalActionBy = actionBy || cancelledBy;
    const finalActionDescriptions =
      actionDescriptions || actionDescription || cancelReason || "";

    if (!finalActionBy || !isValidObjectId(finalActionBy)) {
      return buildResponse(400, "Valid actionBy is required", null);
    }

    if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED, BOOKING_STATUS.COMPLETED].includes(booking.bookingStatus)) {
      return buildResponse(400, "Booking cannot be cancelled in current status", null);
    }

    booking.bookingStatus = BOOKING_STATUS.CANCELLED;
    booking.actionBy = finalActionBy;
    booking.actionAt = new Date();
    booking.actionType = "CANCELLED";
    booking.actionDescriptions = finalActionDescriptions;
    await booking.save();

    await sendBookingNotification({
      booking,
      title: "Booking cancelled",
      message: `Your booking ${booking.bookingNumber} has been cancelled`,
      type: "BOOKING_CANCELLED",
    });

    const populatedBooking = await getBookingDocumentById(booking._id);

    return buildResponse(
      200,
      "Booking cancelled successfully",
      mapBookingResponse(populatedBooking)
    );
  } catch (error) {
    logger.error("cancelBooking error", {
      error: error.message,
      stack: error.stack,
      data,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function remainingBookingAmount(data) {
  try {
    const {
      bookingId,
      paidAmount,
      actionBy,
      actionDescriptions,
      actionDescription,
    } = data;

    logger.info("remainingBookingAmount request received", {
      bookingId,
      paidAmount,
      actionBy,
    });

    if (!bookingId || !isValidObjectId(bookingId)) {
      logger.warn("remainingBookingAmount validation failed", {
        reason: "INVALID_BOOKING_ID",
        bookingId,
      });
      return buildResponse(400, "Valid bookingId is required", null);
    }

    if (!actionBy || !isValidObjectId(actionBy)) {
      logger.warn("remainingBookingAmount validation failed", {
        reason: "INVALID_ACTION_BY",
        bookingId,
        actionBy,
      });
      return buildResponse(400, "Valid actionBy is required", null);
    }

    const amount = Number(paidAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      logger.warn("remainingBookingAmount validation failed", {
        reason: "INVALID_PAID_AMOUNT",
        bookingId,
        paidAmount,
      });
      return buildResponse(400, "Valid paidAmount is required", null);
    }

    const booking = await DharamshalaBooking.findOne({
      _id: bookingId,
      status: 1,
    });

    if (!booking) {
      logger.warn("remainingBookingAmount validation failed", {
        reason: "BOOKING_NOT_FOUND",
        bookingId,
      });
      return buildResponse(404, "Booking not found", null);
    }

    if (booking.bookingStatus !== BOOKING_STATUS.APPROVED) {
      logger.warn("remainingBookingAmount business validation failed", {
        reason: "BOOKING_NOT_APPROVED",
        bookingId,
        bookingNumber: booking.bookingNumber,
        bookingStatus: booking.bookingStatus,
      });
      return buildResponse(400, "Only approved booking payment can be updated", null);
    }

    if (booking.paymentStatus !== 2 || Number(booking.balanceAmount || 0) <= 0) {
      logger.warn("remainingBookingAmount business validation failed", {
        reason: "BOOKING_NOT_PARTIALLY_PAID",
        bookingId,
        bookingNumber: booking.bookingNumber,
        paymentStatus: booking.paymentStatus,
        balanceAmount: booking.balanceAmount,
      });
      return buildResponse(400, "Booking does not have remaining amount", null);
    }

    const currentBalanceAmount = Number(booking.balanceAmount || 0);
    if (amount > currentBalanceAmount) {
      logger.warn("remainingBookingAmount validation failed", {
        reason: "PAID_AMOUNT_GREATER_THAN_BALANCE",
        bookingId,
        bookingNumber: booking.bookingNumber,
        paidAmount: amount,
        balanceAmount: currentBalanceAmount,
      });
      return buildResponse(400, "paidAmount cannot be greater than balanceAmount", {
        balanceAmount: currentBalanceAmount,
      });
    }

    booking.paidAmount = Number(booking.paidAmount || 0) + amount;
    booking.balanceAmount = Math.max(0, currentBalanceAmount - amount);
    booking.paymentStatus = booking.balanceAmount > 0 ? 2 : 3;
    booking.actionBy = actionBy;
    booking.actionAt = new Date();
    booking.actionType = "PAYMENT_UPDATED";
    booking.actionDescriptions =
      actionDescriptions ||
      actionDescription ||
      (booking.balanceAmount > 0
        ? "Partial remaining booking amount received"
        : "Remaining booking amount received");

    await booking.save();

    await sendBookingNotification({
      booking,
      title: "Booking payment updated",
      message: `Payment for booking ${booking.bookingNumber} has been updated`,
      type: "BOOKING_PAYMENT_UPDATED",
    });

    logger.info("remainingBookingAmount completed successfully", {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      receivedAmount: amount,
      paidAmount: booking.paidAmount,
      balanceAmount: booking.balanceAmount,
      paymentStatus: booking.paymentStatus,
      actionBy,
    });

    const populatedBooking = await getBookingDocumentById(booking._id);

    return buildResponse(
      200,
      "Remaining booking amount updated successfully",
      mapBookingResponse(populatedBooking)
    );
  } catch (error) {
    logger.error("remainingBookingAmount error", {
      error: error.message,
      stack: error.stack,
      data,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function blockUnblockBooking({ id, status }) {
  try {
    if (!id || !isValidObjectId(id)) {
      return buildResponse(400, "Valid id is required", null);
    }

    if (status === undefined || status === null || status === "") {
      return buildResponse(400, "status is required", null);
    }

    const numericStatus = Number(status);
    if (![0, 1, 2].includes(numericStatus)) {
      return buildResponse(400, "status must be 0, 1 or 2", null);
    }

    const booking = await DharamshalaBooking.findById(id);
    if (!booking) {
      return buildResponse(404, "Booking not found", null);
    }

    if (booking.status === numericStatus) {
      return buildResponse(400, "Booking already has same status", null);
    }

    booking.status = numericStatus;
    await booking.save();

    const message =
      numericStatus === 0
        ? "Booking deleted successfully"
        : numericStatus === 1
          ? "Booking activated successfully"
          : "Booking blocked successfully";

    return buildResponse(200, message, booking);
  } catch (error) {
    logger.error("blockUnblockBooking error", {
      error: error.message,
      stack: error.stack,
      id,
      status,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

module.exports = {
  addUpdateBookingUnit,
  getAllBookingUnit,
  blockUnblockBookingUnit,
  checkAvailability,
  createBooking,
  getAllBooking,
  getBookingById,
  approveRejectBooking,
  cancelBooking,
  remainingBookingAmount,
  blockUnblockBooking,
};
