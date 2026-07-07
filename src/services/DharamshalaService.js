
const Village = require("../models/Village");

const Dharamshala =
  require("../models/Dharamshala");

const DharamshalaCommittee = require(
  "../models/DharamshalaCommittee"
);

const dharamshalaRepo =
  require("../repositories/DharamshalaRepository");

const logger =
  require("../utils/logger");

const fileUtil =
  require("../utils/FileUtil");
const uploadToCloudinary =
  require(
    "../utils/CloudnaryUploadUtil"
  );
const buildResponse =
  require("../utils/response");

const {
  buildDharamshalaResponse,buildCommitteeResponse
} = require(
  "../utils/ResponseBuilder"
);

const DataConstant = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,

  SHORT_ZERO: 0,
  SHORT_ONE: 1,
  SHORT_TWO: 2,

  RECORD_FOUND: "Record found",
  RECORD_NOT_FOUND:
    "No records found",

  INVALID_REQUEST:
    "Invalid request",

  DHARAMSHALA_CREATED:
    "Dharamshala created successfully",

  DHARAMSHALA_UPDATED:
    "Dharamshala updated successfully",

  DHARAMSHALA_DELETED:
    "Dharamshala deleted successfully",

  DHARAMSHALA_ACTIVE:
    "Dharamshala activated successfully",

  DHARAMSHALA_INACTIVE:
    "Dharamshala inactivated successfully",

  DHARAMSHALA_NOT_FOUND:
    "Dharamshala not found",
};

/* ─────────────────────────────────────
   CREATE / UPDATE DHARAMSHALA
───────────────────────────────────── */

async function addDharamshala(data) {
  try {
    if (!data) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        DataConstant.INVALID_REQUEST,
        null
      );
    }

    logger.info(`addDharamshala called id=${data.id || "NEW"}`);

    if (!data.name || data.name.trim() === "") {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Dharamshala name is required",
        null
      );
    }

    let profileImage = null;
    let bannerImage = null;

    if (data.profileImageFile) {
      try {
        const uploaded = await uploadToCloudinary(
          data.profileImageFile.path,
          "kalota/dharamshala"
        );

        profileImage = uploaded.url;
      } catch (err) {
        logger.error("Failed to upload profile image", err);
      }
    }

    if (data.bannerImageFile) {
      try {
        const uploaded = await uploadToCloudinary(
          data.bannerImageFile.path,
          "kalota/dharamshala/banners"
        );

        bannerImage = uploaded.url;
      } catch (err) {
        logger.error("Failed to upload banner image", err);
      }
    }

    const latitude =
      data.latitude !== undefined &&
      data.latitude !== null &&
      data.latitude !== ""
        ? Number(data.latitude)
        : null;

    const longitude =
      data.longitude !== undefined &&
      data.longitude !== null &&
      data.longitude !== ""
        ? Number(data.longitude)
        : null;

    if (
      latitude !== null &&
      (Number.isNaN(latitude) || latitude < -90 || latitude > 90)
    ) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Invalid latitude",
        null
      );
    }

    if (
      longitude !== null &&
      (Number.isNaN(longitude) || longitude < -180 || longitude > 180)
    ) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Invalid longitude",
        null
      );
    }

    const safeData = {
      name: data.name?.trim(),
      description: data.description || "",
      type: data.type || "DHARAMSHALA",

      villageId: data.villageId || null,
      address: data.address || "",

      mobileNumber: data.mobileNumber || "",
      alternateMobileNumber: data.alternateMobileNumber || "",
      email: data.email || "",
      website: data.website || "",
      establishedYear: data.establishedYear || "",

      latitude,
      longitude,


      status: data.status !== undefined ? Number(data.status) : 1,
      updatedAt: new Date(),
    };

    if (profileImage) {
  safeData.profileImage = profileImage;
}

if (bannerImage) {
  safeData.bannerImage = bannerImage;
}
    if (latitude !== null && longitude !== null) {
      safeData.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    let dharamshala;

    if (!data.id || data.id.trim() === "") {
      dharamshala = await dharamshalaRepo.createDharamshala(safeData);

      logger.info(`Dharamshala created ${dharamshala._id}`);

      return buildResponse(
        DataConstant.OK,
        DataConstant.DHARAMSHALA_CREATED,
        await buildDharamshalaResponse(dharamshala)
      );
    }

    dharamshala = await dharamshalaRepo.updateDharamshala(
      data.id,
      safeData
    );

    if (!dharamshala) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.DHARAMSHALA_NOT_FOUND,
        null
      );
    }

    logger.info(`Dharamshala updated ${data.id}`);

    return buildResponse(
      DataConstant.OK,
      DataConstant.DHARAMSHALA_UPDATED,
      await buildDharamshalaResponse(dharamshala)
    );
  } catch (err) {
    logger.error(`addDharamshala error ${err.message}`, {
      stack: err.stack,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}

/* ─────────────────────────────────────
   GET BY ID
───────────────────────────────────── */

async function getDharamshalaById(id) {
  try {
    logger.info(
      `getDharamshalaById ${id}`
    );

    const dharamshala =
      await dharamshalaRepo.findById(id);

    if (!dharamshala) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.DHARAMSHALA_NOT_FOUND,
        null
      );
    }

    const committees =
      await dharamshalaRepo.findCommitteeByDharamshalaId(
        id
      );

    const response =
      await buildDharamshalaResponse(
        dharamshala
      );

    response.committeeMembers =
      await buildCommitteeResponse(
        committees
      );

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      response
    );
  } catch (err) {
    logger.error(
      `getDharamshalaById error ${err.message}`
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}




async function getNearbyLocations(query) {
  try {
    const latitude = Number(query.latitude);
    const longitude = Number(query.longitude);

    const radiusInKm = query.radiusInKm
      ? Number(query.radiusInKm)
      : 25;

    const type = query.type || "ALL"; 
    // ALL | VILLAGE | DHARAMSHALA | TRUST

    if (
      Number.isNaN(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Valid latitude is required",
        null
      );
    }

    if (
      Number.isNaN(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Valid longitude is required",
        null
      );
    }

    if (
      Number.isNaN(radiusInKm) ||
      radiusInKm <= 0
    ) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Valid radiusInKm is required",
        null
      );
    }

    const maxDistance = radiusInKm * 1000;

    const response = {
      villages: [],
      dharamshalas: [],
    };

    if (type === "ALL" || type === "VILLAGE") {
      response.villages = await Village.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            distanceField: "distanceInMeters",
            maxDistance,
            spherical: true,
            query: {
              status: DataConstant.SHORT_ONE,
              "location.coordinates": { $exists: true },
            },
          },
        },
        {
          $addFields: {
            distanceInKm: {
              $round: [
                {
                  $divide: ["$distanceInMeters", 1000],
                },
                2,
              ],
            },
          },
        },
        {
          $lookup: {
            from: "districts",
            localField: "districtId",
            foreignField: "_id",
            as: "district",
          },
        },
        {
          $lookup: {
            from: "tehsils",
            localField: "tehsilId",
            foreignField: "_id",
            as: "tehsil",
          },
        },
        {
          $unwind: {
            path: "$district",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$tehsil",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            name: 1,
            latitude: 1,
            longitude: 1,
            distanceInKm: 1,
            districtId: 1,
            tehsilId: 1,
            districtName: "$district.name",
            tehsilName: "$tehsil.name",
          },
        },
        {
          $sort: {
            distanceInKm: 1,
          },
        },
      ]);
    }

    if (
      type === "ALL" ||
      type === "DHARAMSHALA" ||
      type === "TRUST"
    ) {
      const dharamshalaQuery = {
        status: DataConstant.SHORT_ONE,
        "location.coordinates": { $exists: true },
      };

      if (type === "DHARAMSHALA") {
        dharamshalaQuery.type = "DHARAMSHALA";
      }

      if (type === "TRUST") {
        dharamshalaQuery.type = "TRUST";
      }

      response.dharamshalas = await Dharamshala.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            distanceField: "distanceInMeters",
            maxDistance,
            spherical: true,
            query: dharamshalaQuery,
          },
        },
        {
          $addFields: {
            distanceInKm: {
              $round: [
                {
                  $divide: ["$distanceInMeters", 1000],
                },
                2,
              ],
            },
          },
        },
        {
          $lookup: {
            from: "villages",
            localField: "villageId",
            foreignField: "_id",
            as: "village",
          },
        },
        {
          $unwind: {
            path: "$village",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            id: "$_id",
            name: 1,
            type: 1,
            address: 1,
            mobileNumber: 1,
            profileImage: 1,
            bannerImage: 1,
            latitude: 1,
            longitude: 1,
            distanceInKm: 1,
            villageId: 1,
            villageName: "$village.name",
          },
        },
        {
          $sort: {
            distanceInKm: 1,
          },
        },
      ]);
    }

    return buildResponse(
      DataConstant.OK,
      "Nearby locations fetched successfully",
      response
    );
  } catch (err) {
    logger.error(`getNearbyLocations error ${err.message}`, {
      stack: err.stack,
    });

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}
/* ─────────────────────────────────────
   GET ALL
───────────────────────────────────── */

async function getAllDharamshala({
  pageIndex,
  pageSize,
  status,
  searchText,
  villageId,
}) {
  try {
    logger.info(
      "getAllDharamshala called",
      {
        pageIndex,
        pageSize,
        status,
        searchText,
        villageId,
      }
    );

    let query = {
      status: {
        $in: [
          DataConstant.SHORT_ONE,
          DataConstant.SHORT_TWO,
        ],
      },
    };

    /* ─────────────────────────────
       STATUS FILTER
    ───────────────────────────── */

    if (
      status !== undefined &&
      status !== null &&
      status !== ""
    ) {
      const parsedStatus =
        parseInt(status);

      if (!isNaN(parsedStatus)) {
        query.status =
          parsedStatus;
      }
    }

    /* ─────────────────────────────
       VILLAGE FILTER
    ───────────────────────────── */

    if (
      villageId &&
      villageId.trim() !== ""
    ) {
      query.villageId =
        villageId;
    }

    /* ─────────────────────────────
       SEARCH
    ───────────────────────────── */

    if (
      searchText &&
      searchText.trim() !== ""
    ) {
      query.$or = [
        {
          name: {
            $regex:
              searchText.trim(),
            $options: "i",
          },
        },
      ];
    }

    const skip =
      pageIndex * pageSize;

    const dharamshalaList =
      await dharamshalaRepo.findAll(
        query,
        skip,
        pageSize
      );

    const totalRecords =
      await dharamshalaRepo.countDocuments(
        query
      );

    const totalActive =
      await dharamshalaRepo.countDocuments(
        {
          status:
            DataConstant.SHORT_ONE,
        }
      );

    const totalInactive =
      await dharamshalaRepo.countDocuments(
        {
          status:
            DataConstant.SHORT_TWO,
        }
      );

    if (
      !dharamshalaList ||
      dharamshalaList.length === 0
    ) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND,
        null
      );
    }

    return buildResponse(
      DataConstant.OK,
      "Records fetched successfully",
      {
        content:
          await Promise.all(
            dharamshalaList.map(
              buildDharamshalaResponse
            )
          ),

        pageIndex,

        pageSize,

        totalRecords,

        totalActive,

        totalInactive,

        totalPages: Math.ceil(
          totalRecords / pageSize
        ),

        isLast:
          pageIndex + 1 >=
          Math.ceil(
            totalRecords /
              pageSize
          ),

        hasNext:
          pageIndex + 1 <
          Math.ceil(
            totalRecords /
              pageSize
          ),

        hasPrevious:
          pageIndex > 0,
      }
    );
  } catch (err) {
    logger.error(
      `getAllDharamshala error ${err.message}`
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}

async function getDharamshalaAndTrustByVillage({ villageId }) {
  try {
    logger.info("getDharamshalaAndTrustByVillage called", {
      villageId,
    });

    if (!villageId || villageId.trim() === "") {
      logger.warn(
        "getDharamshalaAndTrustByVillage: villageId is missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "villageId is required",
        null
      );
    }

    logger.info("Fetching village dharamshalas", {
      villageId,
    });

    const villageDharamshalas = await dharamshalaRepo.findAll(
      {
        villageId,
        type: "DHARAMSHALA",
        status: DataConstant.SHORT_ONE,
      },
      0,
      100
    );

    logger.info("Village dharamshalas fetched", {
      count: villageDharamshalas.length,
    });

    logger.info("Fetching trust dharamshalas");

    const trusts = await dharamshalaRepo.findAll(
      {
        type: "TRUST",
        status: DataConstant.SHORT_ONE,
      },
      0,
      100
    );

    logger.info("Trusts fetched", {
      count: trusts.length,
    });

    const content = [
      ...villageDharamshalas,
      ...trusts,
    ];

    logger.info("Preparing response", {
      totalRecords: content.length,
    });

    const responseContent = await Promise.all(
      content.map(buildDharamshalaResponse)
    );

    logger.info(
      "getDharamshalaAndTrustByVillage completed successfully",
      {
        villageDharamshalaCount:
          villageDharamshalas.length,
        trustCount: trusts.length,
        totalRecords: responseContent.length,
      }
    );

    return buildResponse(
      DataConstant.OK,
      "Records fetched successfully",
      {
        content: responseContent,
        totalRecords: responseContent.length,
      }
    );
  } catch (err) {
    logger.error(
      `getDharamshalaAndTrustByVillage error: ${err.message}`,
      {
        villageId,
        stack: err.stack,
      }
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}

/* ─────────────────────────────────────
   BLOCK / UNBLOCK / DELETE
───────────────────────────────────── */

async function blockUnblockDharamshala(
  id,
  status
) {
  try {
    logger.info(
      `blockUnblockDharamshala id=${id} status=${status}`
    );

    const dharamshala =
      await Dharamshala.findById(id);

    if (!dharamshala) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.DHARAMSHALA_NOT_FOUND,
        null
      );
    }

    if (
      dharamshala.status ===
      status
    ) {
      if (
        status ===
        DataConstant.SHORT_ONE
      ) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Dharamshala already active",
          null
        );
      }

      if (
        status ===
        DataConstant.SHORT_TWO
      ) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Dharamshala already inactive",
          null
        );
      }
    }

    dharamshala.status = status;

    await dharamshala.save();

    let message =
      "Invalid request";

    if (
      status ===
      DataConstant.SHORT_ZERO
    ) {
      message =
        DataConstant.DHARAMSHALA_DELETED;
    }

    if (
      status ===
      DataConstant.SHORT_ONE
    ) {
      message =
        DataConstant.DHARAMSHALA_ACTIVE;
    }

    if (
      status ===
      DataConstant.SHORT_TWO
    ) {
      message =
        DataConstant.DHARAMSHALA_INACTIVE;
    }

    return buildResponse(
      DataConstant.OK,
      message,
      await buildDharamshalaResponse(
        dharamshala
      )
    );
  } catch (err) {
    logger.error(
      `blockUnblockDharamshala error ${err.message}`
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}

/* ─────────────────────────────────────
   TOTAL COUNT
───────────────────────────────────── */

async function getTotalDharamshalaCount() {
  try {
    const total =
      await Dharamshala.countDocuments(
        {
          status: {
            $ne:
              DataConstant.SHORT_ZERO,
          },
        }
      );

    return buildResponse(
      DataConstant.OK,
      "Successfully fetched",
      total
    );
  } catch (err) {
    logger.error(
      `getTotalDharamshalaCount error ${err.message}`
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}



/* ─────────────────────────────────────
   DHARAMSHALA COMMITTEE APIs
   ADD INSIDE DharamshalaService.js
───────────────────────────────────── */



/* ─────────────────────────────────────
   ADD / UPDATE COMMITTEE MEMBER
───────────────────────────────────── */

async function addDharamshalaCommittee(
  data
) {
  try {
    if (!data) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        DataConstant.INVALID_REQUEST,
        null
      );
    }

    const {
      id,
      dharamshalaId,
      userId,
      committeeRole,
      joiningDate,
      endDate,
      remarks,
      appointedBy,
      removedBy,
      removedReason,
      status,
    } = data;

    /* ─────────────────────────────
       VALIDATION
    ───────────────────────────── */

    if (!dharamshalaId) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "dharamshalaId is required",
        null
      );
    }

    if (!userId) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "userId is required",
        null
      );
    }

    if (!committeeRole) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "committeeRole is required",
        null
      );
    }

    if (!joiningDate) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "joiningDate is required",
        null
      );
    }

    const safeData = {
      dharamshalaId,
      userId,
      committeeRole,
      joiningDate,
      endDate:
        endDate || null,
      remarks,
      appointedBy,
      removedBy,
      removedReason,
      status:
        status ??
        DataConstant.SHORT_ONE,
    };

    /* ─────────────────────────────
       CREATE
    ───────────────────────────── */

    if (!id || id.trim() === "") {
      const committee =
        await DharamshalaCommittee.create(
          safeData
        );

      return buildResponse(
        DataConstant.OK,
        "Committee member added successfully",
        committee
      );
    }

    /* ─────────────────────────────
       UPDATE
    ───────────────────────────── */

    const updatedCommittee =
      await DharamshalaCommittee.findByIdAndUpdate(
        id,
        safeData,
        {
          new: true,
        }
      );

    if (!updatedCommittee) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        "Committee member not found",
        null
      );
    }

    return buildResponse(
      DataConstant.OK,
      "Committee member updated successfully",
      updatedCommittee
    );
  } catch (err) {
    logger.error(
      `addDharamshalaCommittee error ${err.message}`
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}

/* ─────────────────────────────────────
   GET ALL COMMITTEE MEMBERS
───────────────────────────────────── */

async function getAllDharamshalaCommittee({
  pageIndex,
  pageSize,
  dharamshalaId,
  status,
  searchText,
}) {
  try {
    let query = {};

    /* ─────────────────────────────
       STATUS FILTER
    ───────────────────────────── */

    if (
      status !== undefined &&
      status !== null &&
      status !== ""
    ) {
      query.status =
        parseInt(status);
    } else {
      query.status = {
        $in: [
          DataConstant.SHORT_ONE,
          DataConstant.SHORT_TWO,
        ],
      };
    }

    /* ─────────────────────────────
       DHARAMSHALA FILTER
    ───────────────────────────── */

    if (dharamshalaId) {
      query.dharamshalaId =
        dharamshalaId;
    }

    const skip =
      pageIndex * pageSize;

    let aggregateQuery = [
      {
        $match: query,
      },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },

      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "dharamshalas",
          localField:
            "dharamshalaId",
          foreignField: "_id",
          as: "dharamshala",
        },
      },

      {
        $unwind: {
          path: "$dharamshala",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    /* ─────────────────────────────
       SEARCH
    ───────────────────────────── */

    if (
      searchText &&
      searchText.trim() !== ""
    ) {
      aggregateQuery.push({
        $match: {
          $or: [
            {
              "user.name": {
                $regex:
                  searchText.trim(),
                $options: "i",
              },
            },

            {
              committeeRole: {
                $regex:
                  searchText.trim(),
                $options: "i",
              },
            },

            {
              "dharamshala.name": {
                $regex:
                  searchText.trim(),
                $options: "i",
              },
            },
          ],
        },
      });
    }

    aggregateQuery.push(
      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $skip: skip,
      },

      {
        $limit: pageSize,
      }
    );

    const committeeList =
      await DharamshalaCommittee.aggregate(
        aggregateQuery
      );

    const totalRecords =
      await DharamshalaCommittee.countDocuments(
        query
      );

    if (
      !committeeList ||
      committeeList.length === 0
    ) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND,
        null
      );
    }

    return buildResponse(
      DataConstant.OK,
      "Records fetched successfully",
      {
        content: committeeList,

        pageIndex,

        pageSize,

        totalRecords,

        totalPages: Math.ceil(
          totalRecords / pageSize
        ),

        isLast:
          pageIndex + 1 >=
          Math.ceil(
            totalRecords /
              pageSize
          ),

        hasNext:
          pageIndex + 1 <
          Math.ceil(
            totalRecords /
              pageSize
          ),

        hasPrevious:
          pageIndex > 0,
      }
    );
  } catch (err) {
    logger.error(
      `getAllDharamshalaCommittee error ${err.message}`
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}

/* ─────────────────────────────────────
   GET COMMITTEE MEMBER BY ID
───────────────────────────────────── */

async function getDharamshalaCommitteeById(
  id
) {
  try {
    const committee =
      await DharamshalaCommittee.findById(
        id
      )
        .populate(
          "userId"
        )
        .populate(
          "dharamshalaId"
        );

    if (!committee) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        "Committee member not found",
        null
      );
    }

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      committee
    );
  } catch (err) {
    logger.error(
      `getDharamshalaCommitteeById error ${err.message}`
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}

/* ─────────────────────────────────────
   BLOCK / UNBLOCK / DELETE
───────────────────────────────────── */

async function blockUnblockCommitteeMember(
  id,
  status
) {
  try {
    const committee =
      await DharamshalaCommittee.findById(
        id
      );

    if (!committee) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        "Committee member not found",
        null
      );
    }

    committee.status = status;

    await committee.save();

    let message =
      "Status updated successfully";

    if (
      status ===
      DataConstant.SHORT_ZERO
    ) {
      message =
        "Committee member deleted successfully";
    }

    if (
      status ===
      DataConstant.SHORT_ONE
    ) {
      message =
        "Committee member activated successfully";
    }

    if (
      status ===
      DataConstant.SHORT_TWO
    ) {
      message =
        "Committee member inactivated successfully";
    }

    return buildResponse(
      DataConstant.OK,
      message,
      committee
    );
  } catch (err) {
    logger.error(
      `blockUnblockCommitteeMember error ${err.message}`
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      err.message,
      null
    );
  }
}

module.exports = {
    addDharamshalaCommittee,
    blockUnblockCommitteeMember,
    getAllDharamshalaCommittee,
    getDharamshalaCommitteeById,
  addDharamshala,
  getDharamshalaById,
  getAllDharamshala,
  blockUnblockDharamshala,
  getTotalDharamshalaCount,
  getNearbyLocations,
  getDharamshalaAndTrustByVillage,
};