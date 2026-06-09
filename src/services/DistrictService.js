// services/DistrictService.js

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

  DISTRICT_CREATED: "District created successfully",
  DISTRICT_UPDATED: "District updated successfully",
  DISTRICT_DELETED: "District deleted successfully",
  DISTRICT_ACTIVE: "District activated successfully",
  DISTRICT_INACTIVE: "District inactivated successfully",

  DISTRICT_NOT_FOUND: "District not found",
  DISTRICT_ALREADY_ACTIVE: "District is already active",
  DISTRICT_ALREADY_INACTIVE: "District is already inactive",

  RECORD_FOUND: "Record found",
  RECORD_NOT_FOUND: "No records found",

  SERVER_MESSAGE: "Internal Server Error",
  INVALID_REQUEST: "Invalid request",
};

// Add / Update District
async function addDistrict(districtRequest) {
  try {
    let district;

    const districtName = districtRequest.name?.trim();

    // ================= UPDATE DISTRICT =================
    if (districtRequest.id) {
      logger.info("Updating district with id: %s", districtRequest.id);

      district = await District.findById(districtRequest.id);

      if (!district) {
        return buildResponse(
          DataConstant.NOT_FOUND,
          DataConstant.DISTRICT_NOT_FOUND
        );
      }

      // Check duplicate name except current district
      const existingDistrict = await District.findOne({
        _id: { $ne: districtRequest.id },
        name: { $regex: `^${districtName}$`, $options: "i" },
        status: { $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO] },
      });

      if (existingDistrict) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "District already exists"
        );
      }

      district.name = districtName;
      district.latitude = districtRequest.latitude ?? null;
      district.longitude = districtRequest.longitude ?? null;
      district.updatedAt = new Date();

      await district.save();

      return buildResponse(
        DataConstant.OK,
        DataConstant.DISTRICT_UPDATED,
        district
      );
    }

    // ================= CREATE DISTRICT =================
    logger.info("Creating district: %s", districtName);

    // Check existing active/inactive district
    const existingDistrict = await District.findOne({
      name: { $regex: `^${districtName}$`, $options: "i" },
      status: { $in: [DataConstant.SHORT_ONE, DataConstant.SHORT_TWO] },
    });

    // Allow only deleted records (status = 0)
    if (existingDistrict) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "District already exists"
      );
    }

    district = await District.create({
      name: districtName,
      latitude: districtRequest.latitude ?? null,
      longitude: districtRequest.longitude ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return buildResponse(
      DataConstant.OK,
      DataConstant.DISTRICT_CREATED,
      district
    );
  } catch (err) {
    logger.error("Error in addDistrict: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get All Districts
async function getAllDistrict(
  pageIndex,
  pageSize,
  status,
  searchText
) {

  try {

    let query = {
      status: {
        $in: [
          DataConstant.SHORT_ONE,
          DataConstant.SHORT_TWO,
        ],
      },
    };

    /*
     * Status Filter
     */

    if (
      status !== undefined &&
      status !== null &&
      status !== ""
    ) {

      const parsedStatus =
        parseInt(status, 10);

      if (
        !isNaN(parsedStatus)
      ) {

        query.status =
          parsedStatus;
      }
    }

    /*
     * Search Filter
     */

    if (
      searchText &&
      searchText.trim() !== ""
    ) {

      query.name = {
        $regex:
          searchText.trim(),

        $options: "i",
      };
    }

    /*
     * Pagination
     */

    pageIndex =
      parseInt(pageIndex) || 0;

    pageSize =
      parseInt(pageSize) || 10;

    const skip =
      pageIndex * pageSize;

    /*
     * Fetch Data
     */

    const [
      data,
      total,
      totalDistrict,
      totalActive,
      totalInactive,
    ] = await Promise.all([

      District.find(query)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(pageSize),

      District.countDocuments(
        query
      ),

      /*
       * Total District
       */

      District.countDocuments({
        status: {
          $in: [
            DataConstant.SHORT_ONE,
            DataConstant.SHORT_TWO,
          ],
        },
      }),

      /*
       * Total Active
       */

      District.countDocuments({
        status:
          DataConstant.SHORT_ONE,
      }),

      /*
       * Total Inactive
       */

      District.countDocuments({
        status:
          DataConstant.SHORT_TWO,
      }),
    ]);

    /*
     * No Records
     */

    if (!data.length) {

      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    /*
     * Success Response
     */

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      {
        content: data,

        pageIndex,

        pageSize,

        total,

        totalPages:
          Math.ceil(
            total / pageSize
          ),

        hasNext:
          skip + data.length <
          total,

        hasPrevious:
          pageIndex > 0,

        totalDistrict,

        totalActive,

        totalInactive,
      }
    );

  } catch (err) {

    logger.error(
      "Error in getAllDistrict: %s",
      err.stack ||
      err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get District By ID
async function getDistrictById(districtId) {
  try {
    const district = await District.findById(districtId);

    if (!district) {
      return buildResponse(
        DataConstant.NO_CONTENT,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      district
    );
  } catch (err) {
    logger.error("Error in getDistrictById: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Get District By Name
async function getDistrictByName(name) {
  try {
    const district = await District.findOne({ name });

    if (!district) {
      return buildResponse(
        DataConstant.NO_CONTENT,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      district
    );
  } catch (err) {
    logger.error("Error in getDistrictByName: %s", err.stack || err.message);

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

// Block / Unblock District
async function blockUnblockDistrict(districtId, status) {
  try {
    const district = await District.findById(districtId);

    if (!district) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    if (district.status === status) {
      if (status === DataConstant.SHORT_ONE) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          DataConstant.DISTRICT_ALREADY_ACTIVE
        );
      }

      if (status === DataConstant.SHORT_TWO) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          DataConstant.DISTRICT_ALREADY_INACTIVE
        );
      }
    }

    district.status = status;

    await district.save();

    let message = DataConstant.INVALID_REQUEST;

    if (status === DataConstant.SHORT_ZERO) {
      message = DataConstant.DISTRICT_DELETED;
    }

    if (status === DataConstant.SHORT_ONE) {
      message = DataConstant.DISTRICT_ACTIVE;
    }

    if (status === DataConstant.SHORT_TWO) {
      message = DataConstant.DISTRICT_INACTIVE;
    }

    return buildResponse(DataConstant.OK, message, district);
  } catch (err) {
    logger.error(
      "Error in blockUnblockDistrict: %s",
      err.stack || err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

module.exports = {
  addDistrict,
  getAllDistrict,
  getDistrictById,
  getDistrictByName,
  blockUnblockDistrict,
};