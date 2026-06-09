// services/VillageService.js

const mongoose = require("mongoose");

const Village = require("../models/Village");
const District = require("../models/District");
const Tehsil = require("../models/Tehsil");

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

  VILLAGE_CREATED: "Village created successfully",
  VILLAGE_UPDATED: "Village updated successfully",
  VILLAGE_DELETED: "Village deleted successfully",
  VILLAGE_ACTIVE: "Village activated successfully",
  VILLAGE_INACTIVE: "Village inactivated successfully",

  VILLAGE_NOT_FOUND: "Village not found",
  DISTRICT_NOT_FOUND: "District not found",
  TEHSIL_NOT_FOUND: "Tehsil not found",

  VILLAGE_ALREADY_ACTIVE: "Village is already active",
  VILLAGE_ALREADY_INACTIVE: "Village is already inactive",

  RECORD_FOUND: "Record found",
  RECORD_NOT_FOUND: "No records found",

  SERVER_MESSAGE: "Internal Server Error",
  INVALID_REQUEST: "Invalid request",
};

// Add / Update Village
async function addVillage(villageRequest) {
  try {
    let village;

    const villageName = villageRequest.name?.trim();

    // ================= VALIDATIONS =================

    // districtId required
    if (!villageRequest.districtId) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "District Id is required"
      );
    }

    // tehsilId required
    if (!villageRequest.tehsilId) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Tehsil Id is required"
      );
    }

    // village name required
    if (!villageName) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Village name is required"
      );
    }

    // Validate district ObjectId
    if (!mongoose.Types.ObjectId.isValid(villageRequest.districtId)) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Invalid District Id"
      );
    }

    // Validate tehsil ObjectId
    if (!mongoose.Types.ObjectId.isValid(villageRequest.tehsilId)) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Invalid Tehsil Id"
      );
    }

    // Validate District
    const district = await District.findOne({
      _id: villageRequest.districtId,
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

    // Validate Tehsil
    const tehsil = await Tehsil.findOne({
      _id: villageRequest.tehsilId,
      districtId: villageRequest.districtId,
      status: {
        $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO],
      },
    });

    if (!tehsil) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        DataConstant.TEHSIL_NOT_FOUND
      );
    }

    // ================= UPDATE =================
    if (villageRequest.id) {
      logger.info("Updating village with id: %s", villageRequest.id);

      if (!mongoose.Types.ObjectId.isValid(villageRequest.id)) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Invalid Village Id"
        );
      }

      village = await Village.findById(villageRequest.id);

      if (!village) {
        return buildResponse(
          DataConstant.NOT_FOUND,
          DataConstant.VILLAGE_NOT_FOUND
        );
      }

      // Duplicate validation
      const existingVillage = await Village.findOne({
        _id: { $ne: villageRequest.id },
        districtId: villageRequest.districtId,
        tehsilId: villageRequest.tehsilId,
        name: { $regex: `^${villageName}$`, $options: "i" },
        status: {
          $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO],
        },
      });

      if (existingVillage) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Village already exists"
        );
      }

      village.districtId = villageRequest.districtId;
      village.tehsilId = villageRequest.tehsilId;
      village.name = villageName;
      village.latitude = villageRequest.latitude ?? null;
      village.longitude = villageRequest.longitude ?? null;
      village.updatedAt = new Date();

      await village.save();

      return buildResponse(
        DataConstant.OK,
        DataConstant.VILLAGE_UPDATED,
        village
      );
    }

    // ================= CREATE =================
    logger.info("Creating village: %s", villageName);

    const existingVillage = await Village.findOne({
      districtId: villageRequest.districtId,
      tehsilId: villageRequest.tehsilId,
      name: { $regex: `^${villageName}$`, $options: "i" },
      status: {
        $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO],
      },
    });

    if (existingVillage) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Village already exists"
      );
    }

    village = await Village.create({
      districtId: villageRequest.districtId,
      tehsilId: villageRequest.tehsilId,
      name: villageName,
      latitude: villageRequest.latitude ?? null,
      longitude: villageRequest.longitude ?? null,
      status: DataConstant.SHORT_ONE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return buildResponse(
      DataConstant.OK,
      DataConstant.VILLAGE_CREATED,
      village
    );
  } catch (err) {
    logger.error("Error in addVillage: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get All Village
async function getAllVillage(
  pageIndex,
  pageSize,
  status,
  searchText,
  districtId,
  tehsilId
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

    if (tehsilId) {
      query.tehsilId = tehsilId;
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
      Village.find(query)
        .populate("districtId")
        .populate("tehsilId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),

      Village.countDocuments(query),
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
    logger.error("Error in getAllVillage: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get Village By ID
async function getVillageById(villageId) {
  try {
    const village = await Village.findById(villageId)
      .populate("districtId")
      .populate("tehsilId");

    if (!village) {
      return buildResponse(
        DataConstant.NO_CONTENT,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      village
    );
  } catch (err) {
    logger.error("Error in getVillageById: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get Village By Name
async function getVillageByName(name) {
  try {
    const village = await Village.findOne({
      name,
    })
      .populate("districtId")
      .populate("tehsilId");

    if (!village) {
      return buildResponse(
        DataConstant.NO_CONTENT,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      village
    );
  } catch (err) {
    logger.error("Error in getVillageByName: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Block / Unblock Village
async function blockUnblockVillage(villageId, status) {
  try {
    const village = await Village.findById(villageId);

    if (!village) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    if (village.status === status) {
      if (status === DataConstant.SHORT_ONE) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          DataConstant.VILLAGE_ALREADY_ACTIVE
        );
      }

      if (status === DataConstant.SHORT_TWO) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          DataConstant.VILLAGE_ALREADY_INACTIVE
        );
      }
    }

    village.status = status;

    await village.save();

    let message = DataConstant.INVALID_REQUEST;

    if (status === DataConstant.SHORT_ZERO) {
      message = DataConstant.VILLAGE_DELETED;
    }

    if (status === DataConstant.SHORT_ONE) {
      message = DataConstant.VILLAGE_ACTIVE;
    }

    if (status === DataConstant.SHORT_TWO) {
      message = DataConstant.VILLAGE_INACTIVE;
    }

    return buildResponse(DataConstant.OK, message, village);
  } catch (err) {
    logger.error(
      "Error in blockUnblockVillage: %s",
      err.stack || err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

module.exports = {
  addVillage,
  getAllVillage,
  getVillageById,
  getVillageByName,
  blockUnblockVillage,
};