// controllers/PersonController.js

const PersonService =
  require("../services/PersonService");

/* ───────────────── CREATE MEMBER PROFILE ───────────────── */

async function createMemberProfile(
  req,
  res
) {

  try {

    const {
      familyId,
    } = req.body;

    const response =
      await PersonService.createMemberProfileService(
        familyId,
        req.body,
        req.file
      );

    return res
      .status(
        response.responseCode
      )
      .json(response);

  } catch (err) {

    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}

/* ───────────────── UPDATE PROFILE ───────────────── */

async function updateProfile(
  req,
  res
) {

  try {

    const {
      personId,
    } = req.body;

    const response =
      await PersonService.updateProfileService(
        personId,
        req.body,
        req.file
      );

    return res
      .status(
        response.responseCode
      )
      .json(response);

  } catch (err) {

    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}

/* ───────────────── DELETE PROFILE ───────────────── */

async function deleteProfile(
  req,
  res
) {

  try {

    const {
      personId,
    } = req.query;

    const response =
      await PersonService.deleteProfileService(
        personId
      );

    return res
      .status(
        response.responseCode
      )
      .json(response);

  } catch (err) {

    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}

/* ───────────────── GET PROFILE BY ID ───────────────── */

async function getProfileById(
  req,
  res
) {

  try {

    const {
      personId,
    } = req.query;

    if (!personId) {

      return res.status(400).json({
        responseCode: 400,
        message:
          "personId is required",
      });
    }

    const response =
      await PersonService.getProfileByIdService(
        personId
      );

    return res
      .status(
        response.responseCode
      )
      .json(response);

  } catch (err) {

    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}





async function getPersonsByFamily(
  req,
  res
) {

  try {

    const { familyId } =
      req.query;

    const response =
      await PersonService.getPersonsByFamilyIdService(
        familyId
      );

    return res
      .status(
        response.responseCode
      )
      .json(response);

  } catch (error) {

    return res
      .status(500)
      .json({
        responseCode: 500,
        message:
          "Internal Server Error",
      });
  }
}

async function blockUnblockPerson(
  req,
  res
) {
  try {
    const { id, status } =
      req.body;

    const response =
      await PersonService.blockUnblockPersonService(
        id,
        status
      );

    return res
      .status(
        response.responseCode
      )
      .json(response);
  } catch (err) {
    return res.status(500).json({
      responseCode: 500,
      message: err.message,
    });
  }
}


module.exports = {
  createMemberProfile,
  updateProfile,
  deleteProfile,
  getProfileById,
  getPersonsByFamily,
  blockUnblockPerson,
};
