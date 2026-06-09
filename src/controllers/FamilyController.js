// controllers/FamilyController.js

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

module.exports = {
  createFamilyHead,
  checkDuplicateFamily,
  getFamilyProfileById,
};