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


module.exports = {
  getAllFamilies,
  createFamilyHead,
  checkDuplicateFamily,
  getFamilyProfileById,
};