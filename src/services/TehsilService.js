// services/TehsilService.js

const Tehsil = require("../models/Tehsil");
const District = require("../models/District");

const buildResponse = require("../utils/response");
const logger = require("../utils/logger");

const DataConstant = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  NO_CONTENT: 204,
  SERVER_ERROR: 500,

  SHORT_ZERO: 0,
  SHORT_ONE: 1,
  SHORT_TWO: 2,

  TEHSIL_CREATED: "Tehsil created successfully",
  TEHSIL_UPDATED: "Tehsil updated successfully",
  TEHSIL_DELETED: "Tehsil deleted successfully",
  TEHSIL_ACTIVE: "Tehsil activated successfully",
  TEHSIL_INACTIVE: "Tehsil inactivated successfully",

  TEHSIL_NOT_FOUND: "Tehsil not found",
  DISTRICT_NOT_FOUND: "District not found",

  TEHSIL_ALREADY_ACTIVE: "Tehsil is already active",
  TEHSIL_ALREADY_INACTIVE: "Tehsil is already inactive",

  RECORD_FOUND: "Record found",
  RECORD_NOT_FOUND: "No records found",

  SERVER_MESSAGE: "Internal Server Error",
  INVALID_REQUEST: "Invalid request",
};

// Add / Update Tehsil
const mongoose = require("mongoose");

async function addTehsil(tehsilRequest) {
  try {
    let tehsil;

    const tehsilName = tehsilRequest.name?.trim();

    // ================= VALIDATIONS =================

    // districtId required
    if (!tehsilRequest.districtId) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "District Id is required"
      );
    }

    // Check valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(tehsilRequest.districtId)) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Invalid District Id"
      );
    }

    // name required
    if (!tehsilName) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Tehsil name is required"
      );
    }

    // Validate District Exists & not deleted
    const district = await District.findOne({
      _id: tehsilRequest.districtId,
      status: {
        $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO],
      },
    });

    if (!district) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        DataConstant.DISTRICT_NOT_FOUND
      );
    }

    // ================= UPDATE =================
    if (tehsilRequest.id) {
      logger.info("Updating tehsil with id: %s", tehsilRequest.id);

      // Check valid tehsil id
      if (!mongoose.Types.ObjectId.isValid(tehsilRequest.id)) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Invalid Tehsil Id"
        );
      }

      tehsil = await Tehsil.findById(tehsilRequest.id);

      if (!tehsil) {
        return buildResponse(
          DataConstant.NOT_FOUND,
          DataConstant.TEHSIL_NOT_FOUND
        );
      }

      // Duplicate validation
      const existingTehsil = await Tehsil.findOne({
        _id: { $ne: tehsilRequest.id },
        districtId: tehsilRequest.districtId,
        name: { $regex: `^${tehsilName}$`, $options: "i" },
        status: {
          $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO],
        },
      });

      if (existingTehsil) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Tehsil already exists"
        );
      }

      tehsil.districtId = tehsilRequest.districtId;
      tehsil.name = tehsilName;
      tehsil.latitude = tehsilRequest.latitude ?? null;
      tehsil.longitude = tehsilRequest.longitude ?? null;
      tehsil.updatedAt = new Date();

      await tehsil.save();

      return buildResponse(
        DataConstant.OK,
        DataConstant.TEHSIL_UPDATED,
        tehsil
      );
    }

    // ================= CREATE =================
    logger.info("Creating tehsil: %s", tehsilName);

    const existingTehsil = await Tehsil.findOne({
      districtId: tehsilRequest.districtId,
      name: { $regex: `^${tehsilName}$`, $options: "i" },
      status: {
        $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO],
      },
    });

    if (existingTehsil) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Tehsil already exists"
      );
    }

    tehsil = await Tehsil.create({
      districtId: tehsilRequest.districtId,
      name: tehsilName,
      latitude: tehsilRequest.latitude ?? null,
      longitude: tehsilRequest.longitude ?? null,
      status: DataConstant.SHORT_ONE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return buildResponse(
      DataConstant.OK,
      DataConstant.TEHSIL_CREATED,
      tehsil
    );
  } catch (err) {
    logger.error("Error in addTehsil: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get All Tehsil
async function getAllTehsil(
  pageIndex,
  pageSize,
  status,
  searchText,
  districtId
) {
  try {
    let query = {
      status: {
        $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO],
      },
    };

    if (districtId) {
      query.districtId = districtId;
    }

    if (status !== undefined && status !== null && status !== "") {
      const parsedStatus = parseInt(status, 10);

      if (!isNaN(parsedStatus)) {
        query.status = parsedStatus;
      }
    }

    if (searchText && searchText.trim() !== "") {
      query.name = {
        $regex: searchText.trim(),
        $options: "i",
      };
    }

    pageIndex = parseInt(pageIndex) || 0;
    pageSize = parseInt(pageSize) || 10;

    const skip = pageIndex * pageSize;

    const [data, total] = await Promise.all([
      Tehsil.find(query)
        .populate("districtId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),

      Tehsil.countDocuments(query),
    ]);

    if (!data.length) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    return buildResponse(DataConstant.OK, DataConstant.RECORD_FOUND, {
      content: data,
      pageIndex,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: skip + data.length < total,
      hasPrevious: pageIndex > 0,
    });
  } catch (err) {
    logger.error("Error in getAllTehsil: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get Tehsil By ID
async function getTehsilById(tehsilId) {
  try {
    const tehsil = await Tehsil.findById(tehsilId).populate(
      "districtId"
    );

    if (!tehsil) {
      return buildResponse(
        DataConstant.NO_CONTENT,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      tehsil
    );
  } catch (err) {
    logger.error("Error in getTehsilById: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get Tehsil By Name
async function getTehsilByName(name) {
  try {
    const tehsil = await Tehsil.findOne({
      name,
    }).populate("districtId");

    if (!tehsil) {
      return buildResponse(
        DataConstant.NO_CONTENT,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      tehsil
    );
  } catch (err) {
    logger.error("Error in getTehsilByName: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Block / Unblock Tehsil
async function blockUnblockTehsil(tehsilId, status) {
  try {
    const tehsil = await Tehsil.findById(tehsilId);

    if (!tehsil) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    if (tehsil.status === status) {
      if (status === DataConstant.SHORT_ONE) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          DataConstant.TEHSIL_ALREADY_ACTIVE
        );
      }

      if (status === DataConstant.SHORT_TWO) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          DataConstant.TEHSIL_ALREADY_INACTIVE
        );
      }
    }

    tehsil.status = status;

    await tehsil.save();

    let message = DataConstant.INVALID_REQUEST;

    if (status === DataConstant.SHORT_ZERO) {
      message = DataConstant.TEHSIL_DELETED;
    }

    if (status === DataConstant.SHORT_ONE) {
      message = DataConstant.TEHSIL_ACTIVE;
    }

    if (status === DataConstant.SHORT_TWO) {
      message = DataConstant.TEHSIL_INACTIVE;
    }

    return buildResponse(DataConstant.OK, message, tehsil);
  } catch (err) {
    logger.error(
      "Error in blockUnblockTehsil: %s",
      err.stack || err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

module.exports = {
  addTehsil,
  getAllTehsil,
  getTehsilById,
  getTehsilByName,
  blockUnblockTehsil,
};