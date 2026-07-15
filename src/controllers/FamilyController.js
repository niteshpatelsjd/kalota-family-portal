// controllers/FamilyController.js
const logger = require("../utils/logger");
const FamilyService = require("../services/FamilyService");

// Create Family Head
async function createFamilyHead(req, res) {
  try {
    const response =
      await FamilyService.createFamilyHead(
        req.body,
        req.file
      );

    return res.status(response.responseCode).json(response);

  } catch (err) {

    return res.status(500).json({
      code: 500,
      message: err.message,
    });
  }
}

async function createOrUpdateFamilyHead(
  req,
  res
) {

  try {

    const response =
      await FamilyService.createOrUpdateFamilyHead(
        req.body,
        req.file
      );

    return res
      .status(response.responseCode)
      .json(response);

  } catch (err) {

    logger.error(
      "Error in createOrUpdateFamilyHead controller: %s",
      err.stack || err.message
    );

    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}

// Check Duplicate Family
async function checkDuplicateFamily(req, res) {
  try {
    const response =
      await FamilyService.checkDuplicateFamily(
        req.body
      );

    return res.status(response.responseCode).json(response);

  } catch (err) {

    return res.status(500).json({
      code: 500,
      message: err.message,
    });
  }
}

// Get Family Profile
async function getFamilyProfileById(req, res) {
  try {

    const response =
      await FamilyService.getFamilyProfileById(
        req.query.familyId
      );

    return res.status(response.responseCode).json(response);

  } catch (err) {

    return res.status(500).json({
      code: 500,
      message: err.message,
    });
  }
}


/* ───────────────── GET ALL FAMILIES ───────────────── */

async function getAllFamilies(
  req,
  res
) {
  try {
    logger.info(
      "FamilyController => getAllFamilies"
    );

    const {
      pageIndex,
      pageSize,
      status,
      searchText,
      districtId,
      tehsilId,
      villageId,
    } = req.query;

    const response =
      await FamilyService.getAllFamilies(
        pageIndex,
        pageSize,
        status,
        searchText,
        districtId,
        tehsilId,
        villageId
      );

    return res
      .status(response.responseCode)
      .json(response);

  } catch (err) {

    logger.error(
      "Error in getAllFamilies controller: %s",
      err.stack || err.message
    );

    return res.status(500).json(
      buildResponse(
        500,
        "Internal Server Error"
      )
    );
  }
}

async function blockUnblockFamily(
  req,
  res
) {
  try {
    const { id, status } =
      req.body;

    const response =
      await FamilyService.blockUnblockFamily(
        id,
        status
      );

    return res
      .status(response.responseCode)
      .json(response);
  } catch (err) {
    logger.error(
      "Error in blockUnblockFamily controller: %s",
      err.stack || err.message
    );

    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}


module.exports = {
  getAllFamilies,
  createFamilyHead,
  checkDuplicateFamily,
  getFamilyProfileById,
  createOrUpdateFamilyHead,
  blockUnblockFamily,
};
