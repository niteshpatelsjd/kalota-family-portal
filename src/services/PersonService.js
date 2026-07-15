const mongoose = require("mongoose");

const Village = require("../models/Village");

const logger = require("../utils/logger");

const buildResponse = require("../utils/response");

const {
  createPerson,
  updatePerson,
  getHeadPersonByFamilyId,
  getPersonById,
  getPersonsByFamilyId,
  deletePerson,
} = require("../repositories/PersonRepository");

const {
  incrementFamilyMembers,
  decrementFamilyMembers,
} = require("../repositories/FamilyRepository");

const {
  uploadFile,
} = require("../utils/FileUtil");

const uploadToCloudinary =
  require(
    "../utils/CloudnaryUploadUtil"
  );

const DataConstant = {
  OK: 200,

  BAD_REQUEST: 400,

  NOT_FOUND: 404,

  SERVER_ERROR: 500,

  SHORT_ZERO: 0,

  SHORT_ONE: 1,

  SHORT_TWO: 2,

  MEMBER_CREATED:
    "Member created successfully",

  PROFILE_UPDATED:
    "Profile updated successfully",

  PROFILE_DELETED:
    "Profile deleted successfully",

  RECORD_FOUND:
    "Record found",

  RECORD_NOT_FOUND:
    "No records found",

  SERVER_MESSAGE:
    "Internal Server Error",
};

const RELATION_CONFIG = {
  FATHER: {
    gender: "MALE",
    single: true,
  },

  MOTHER: {
    gender: "FEMALE",
    single: true,
  },

  SON: {
    gender: "MALE",
  },

  DAUGHTER: {
    gender: "FEMALE",
  },

  BROTHER: {
    gender: "MALE",
  },

  SISTER: {
    gender: "FEMALE",
  },

  GRANDSON: {
    gender: "MALE",
  },

  GRANDDAUGHTER: {
    gender: "FEMALE",
  },

  SPOUSE: {
    oppositeGender: true,
  },
};

/* ───────────────── CREATE MEMBER PROFILE ───────────────── */

async function createMemberProfileService(
  familyId,
  body,
  file
) {

  const session =
    await mongoose.startSession();

  try {

    session.startTransaction();

    logger.info(
      "Starting createMemberProfileService"
    );

    const {
      relationType,
      villageId,
      linkedPersonId,
      spousePersonId,
    } = body;

    /*
     * Validation
     */

    if (!familyId) {

      logger.warn(
        "familyId missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "familyId is required"
      );
    }

    if (!relationType) {

      logger.warn(
        "relationType missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "relationType is required"
      );
    }

    if (!villageId) {

      logger.warn(
        "villageId missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "villageId is required"
      );
    }

    /*
     * Validate relationType
     */

    const relationConfig =
      RELATION_CONFIG[
        relationType
      ];

    if (!relationConfig) {

      logger.warn(
        "Invalid relationType"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Invalid relationType"
      );
    }

    /*
     * Get Family Head
     */

    logger.info(
      "Fetching family head"
    );

    const head =
      await getHeadPersonByFamilyId(
        familyId
      );

    if (!head) {

      logger.warn(
        "Family head not found"
      );

      return buildResponse(
        DataConstant.NOT_FOUND,
        "Family head not found"
      );
    }

    /*
     * SPOUSE / SISTER / DAUGHTER /
     * GRANDDAUGHTER Validation
     */

    let linkedPerson =
      null;

    const linkedRelations = [
      "SPOUSE",
      "SISTER",
      "SON",
      "DAUGHTER",
      "GRANDSON",
      "GRANDDAUGHTER",
    ];

    /*
     * linkedPersonId optional
     *
     * If spouse family profile
     * already exists then pass
     * linkedPersonId
     *
     * Else create standalone
     * profile without linking
     */

    if (
      linkedRelations.includes(
        relationType
      ) &&
      linkedPersonId
    ) {

      linkedPerson =
        await getPersonById(
          linkedPersonId
        );

      if (
        !linkedPerson
      ) {

        logger.warn(
          "Linked person not found"
        );

        return buildResponse(
          DataConstant.NOT_FOUND,
          "Linked person not found"
        );
      }
    }

    let spousePerson =
      null;

    if (
      spousePersonId
    ) {

      spousePerson =
        await getPersonById(
          spousePersonId
        );

      if (
        !spousePerson
      ) {

        logger.warn(
          "Spouse person not found"
        );

        return buildResponse(
          DataConstant.NOT_FOUND,
          "Spouse person not found"
        );
      }
    }

    /*
     * Single Relation Validation
     */

    if (
      relationConfig.single
    ) {

      const existing =
        await getPersonById(
          head._id
        );

      if (
        relationType ===
          "FATHER" &&
        existing.fatherId
      ) {

        logger.warn(
          "Father already exists"
        );

        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Father already exists"
        );
      }

      if (
        relationType ===
          "MOTHER" &&
        existing.motherId
      ) {

        logger.warn(
          "Mother already exists"
        );

        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Mother already exists"
        );
      }
    }

    /*
     * Validate Village
     */

    logger.info(
      "Validating village"
    );

    const village =
      await Village.findById(
        villageId
      );

    if (!village) {

      logger.warn(
        "Village not found"
      );

      return buildResponse(
        DataConstant.NOT_FOUND,
        "Village not found"
      );
    }

    /*
     * Upload Profile Image
     */

    let profileImage =
      null;

if (file) {

  logger.info(
    "Uploading profile image to Cloudinary"
  );

  const uploaded =
    await uploadToCloudinary(
      file.path,
      "kalota/families"
    );

  profileImage =
    uploaded?.url || null;
}

    /*
     * Gender Logic
     */

    let gender =
      relationConfig.gender;

    /*
     * Opposite gender for spouse
     */

    if (
      relationType ===
        "SPOUSE" &&
      linkedPerson
    ) {

      gender =
        linkedPerson.gender ===
        "MALE"
          ? "FEMALE"
          : "MALE";
    }

    /*
     * Handle parentVillageId
     */

    const shouldKeepParentVillage =
      (
        [
          "SPOUSE",
          "MOTHER",
          "SISTER",
          "DAUGHTER",
          "GRANDDAUGHTER",
        ].includes(
          relationType
        )
      ) &&
      body.maritalStatus ===
        "MARRIED";

    /*
     * Remove parentVillageId
     * if not required
     */

    if (
      !shouldKeepParentVillage
    ) {

      delete body.parentVillageId;
    }

    /*
     * Prepare Payload
     */

    const payload = {
      ...body,

      familyRefId:
        head.familyRefId,

      familyHeadId:
        head._id,

      linkedPersonId:
        linkedPersonId ||
        null,

      familyId,

      relationType,

      gender,

      villageId:
        village._id,

      profileImage,
    };

    /*
     * Remove Empty ObjectIds
     */

    [
      "parentVillageId",
      "fatherId",
      "motherId",
      "linkedPersonId",
      "spousePersonId",
      "nativeFamilyRefId",
      "marriedFamilyRefId",
    ].forEach((key) => {

      if (
        payload[key] === "" ||
        payload[key] === null ||
        payload[key] === undefined
      ) {

        delete payload[key];
      }
    });

    delete payload.spousePersonId;

    /*
     * Remove Empty Enums
     */

    [
      "education",
      "occupation",
      "maritalStatus",
    ].forEach((key) => {

      if (
        payload[key] === ""
      ) {

        delete payload[key];
      }
    });

    /*
     * Create Member
     */

    logger.info(
      "Creating member profile"
    );

    const member =
      await createPerson(
        payload,
        session
      );

    /*
     * Update Relationships
     */
    if (relationType === "FATHER") {

      logger.info("Updating father relation");

      await updatePerson(
        head._id,
        { fatherId: member._id },
        session
      );
    }

    if (relationType === "MOTHER") {

      logger.info("Updating mother relation");

      await updatePerson(
        head._id,
        { motherId: member._id },
        session
      );
    }

    const spouseLinkStatuses = [
      "MARRIED",
      "WIDOW",
      "WIDOWER",
    ];
    const canLinkSpouseFromSpousePersonId =
      spouseLinkStatuses.includes(
        member.maritalStatus
      );
    const spouseTargetPersonId =
      relationType === "SPOUSE"
        ? linkedPersonId
        : canLinkSpouseFromSpousePersonId
          ? spousePersonId
          : null;

    if (
      spouseTargetPersonId &&
      spouseTargetPersonId.toString() !==
        member._id.toString()
    ) {

      logger.info("Updating spouse relation");

      await updatePerson(
        spouseTargetPersonId,
        {
          $addToSet: {
            spouseIds: member._id,
          },
        },
        session
      );

      await updatePerson(
        member._id,
        {
          $addToSet: {
            spouseIds: spouseTargetPersonId,
          },
        },
        session
      );
    }

    const childRelationTypes = [
      "SON",
      "DAUGHTER",
      "GRANDSON",
      "GRANDDAUGHTER",
    ];

    if (
      childRelationTypes.includes(relationType) &&
      linkedPerson
    ) {

      logger.info("Updating parent-child relation");

      const memberParentUpdate = {};

      if (linkedPerson.gender === "FEMALE") {
        memberParentUpdate.motherId =
          linkedPerson._id;
      } else {
        memberParentUpdate.fatherId =
          linkedPerson._id;
      }

      await updatePerson(
        linkedPerson._id,
        {
          $addToSet: {
            childrenIds: member._id,
          },
        },
        session
      );

      await updatePerson(
        member._id,
        memberParentUpdate,
        session
      );
    }

    /*
     * Increment Family Members
     */

    await incrementFamilyMembers(
      head.familyRefId,
      session
    );

    await session.commitTransaction();

    logger.info(
      "Member profile created successfully"
    );

    return buildResponse(
      DataConstant.OK,
      DataConstant.MEMBER_CREATED,
      member
    );

  } catch (error) {

    await session.abortTransaction();

    logger.error(
      "Error in createMemberProfileService: %s",
      error.stack ||
        error.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );

  } finally {

    session.endSession();

    logger.info(
      "createMemberProfileService session ended"
    );
  }
}

/* ───────────────── UPDATE PROFILE ───────────────── */
async function updateProfileService(
  personId,
  body,
  file
) {

  const session =
    await mongoose.startSession();

  try {

    session.startTransaction();

    logger.info(
      "Starting updateProfileService"
    );

    /*
     * Validation
     */

    if (!personId) {

      logger.warn(
        "personId missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "personId is required"
      );
    }

    /*
     * Existing Profile
     */

    const existingPerson =
      await getPersonById(
        personId
      );

    if (!existingPerson) {

      logger.warn(
        "Profile not found"
      );

      return buildResponse(
        DataConstant.NOT_FOUND,
        "Profile not found"
      );
    }

    /*
     * Validate Village
     */

    if (
      body.villageId
    ) {

      logger.info(
        "Validating village"
      );

      const village =
        await Village.findById(
          body.villageId
        );

      if (!village) {

        logger.warn(
          "Village not found"
        );

        return buildResponse(
          DataConstant.NOT_FOUND,
          "Village not found"
        );
      }
    }

    /*
     * Validate linkedPersonId
     */

    let linkedPerson =
      null;

    const linkedRelations = [
      "SPOUSE",
      "SISTER",
      "DAUGHTER",
      "GRANDDAUGHTER",
    ];

    if (
      linkedRelations.includes(
        existingPerson.relationType
      ) &&
      body.linkedPersonId
    ) {

      linkedPerson =
        await getPersonById(
          body.linkedPersonId
        );

      if (
        !linkedPerson
      ) {

        logger.warn(
          "Linked person not found"
        );

        return buildResponse(
          DataConstant.NOT_FOUND,
          "Linked person not found"
        );
      }
    }

    /*
     * Upload Profile Image
     */

    let profileImage =
      existingPerson.profileImage;

if (file) {

  logger.info(
    "Uploading updated profile image to Cloudinary"
  );

  const uploaded =
    await uploadToCloudinary(
      file.path,
      "kalota/families"
    );

  profileImage =
    uploaded?.url || null;
}

    /*
     * Handle parentVillageId
     */

    const maritalStatus =
      body.maritalStatus ||
      existingPerson.maritalStatus;

    const shouldKeepParentVillage =
      (
        [
          "SPOUSE",
          "MOTHER",
          "SISTER",
          "DAUGHTER",
          "GRANDDAUGHTER",
        ].includes(
          existingPerson.relationType
        )
      ) &&
      maritalStatus ===
        "MARRIED";

    /*
     * Remove parentVillageId
     * if not required
     */

    if (
      !shouldKeepParentVillage
    ) {

      delete body.parentVillageId;
    }

    /*
     * Gender Logic
     */

    let gender =
      existingPerson.gender;

    if (
      existingPerson.relationType ===
        "SPOUSE" &&
      linkedPerson
    ) {

      gender =
        linkedPerson.gender ===
        "MALE"
          ? "FEMALE"
          : "MALE";
    }

    /*
     * Prepare Update Payload
     */

    const updatePayload = {
      ...body,

      gender,

      profileImage,
    };

    /*
     * Restricted Fields
     */

    delete updatePayload.relationType;

    delete updatePayload.familyId;

    delete updatePayload.familyRefId;

    delete updatePayload.familyHeadId;

    delete updatePayload.fatherId;

    delete updatePayload.motherId;

    delete updatePayload.spouseIds;

    delete updatePayload.childrenIds;

    delete updatePayload.status;

    /*
     * Remove Empty ObjectIds
     */

    [
      "parentVillageId",
      "linkedPersonId",
      "nativeFamilyRefId",
      "marriedFamilyRefId",
    ].forEach((key) => {

      if (
        updatePayload[key] === "" ||
        updatePayload[key] === null ||
        updatePayload[key] === undefined
      ) {

        delete updatePayload[key];
      }
    });

    /*
     * Remove Empty Enums
     */

    [
      "education",
      "occupation",
      "maritalStatus",
    ].forEach((key) => {

      if (
        updatePayload[key] === ""
      ) {

        delete updatePayload[key];
      }
    });

    /*
     * Update Profile
     */

    logger.info(
      "Updating profile"
    );

    const updatedProfile =
      await updatePerson(
        personId,
        updatePayload,
        session
      );

    /*
     * Update spouse relation
     */

    if (
      linkedRelations.includes(
        existingPerson.relationType
      ) &&
      body.linkedPersonId
    ) {

      /*
       * Add current profile
       * into linked person spouseIds
       */

      await updatePerson(
        body.linkedPersonId,
        {
          $addToSet: {
            spouseIds:
              existingPerson._id,
          },
        },
        session
      );

      /*
       * Add linked person
       * into current profile spouseIds
       */

      await updatePerson(
        existingPerson._id,
        {
          $addToSet: {
            spouseIds:
              body.linkedPersonId,
          },
        },
        session
      );
    }

    await session.commitTransaction();

    logger.info(
      "Profile updated successfully"
    );

    return buildResponse(
      DataConstant.OK,
      DataConstant.PROFILE_UPDATED,
      updatedProfile
    );

  } catch (error) {

    await session.abortTransaction();

    logger.error(
      "Error in updateProfileService: %s",
      error.stack ||
        error.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );

  } finally {

    session.endSession();

    logger.info(
      "updateProfileService session ended"
    );
  }
}


/* ───────────────── GET PROFILE BY ID ───────────────── */

async function getProfileByIdService(
  personId
) {

  try {

    logger.info(
      "Starting getProfileByIdService"
    );

    /*
     * Validation
     */

    if (!personId) {

      logger.warn(
        "personId missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "personId is required"
      );
    }

    /*
     * Fetch Profile
     */

    logger.info(
      "Fetching profile"
    );

    const profile =
      await getPersonById(
        personId
      );

    if (!profile) {

      logger.warn(
        "Profile not found"
      );

      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    logger.info(
      "Profile fetched successfully"
    );

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      profile
    );

  } catch (error) {

    logger.error(
      "Error in getProfileByIdService: %s",
      error.stack ||
        error.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}
/* ───────────────── DELETE PROFILE ───────────────── */

async function deleteProfileService(
  personId
) {

  const session =
    await mongoose.startSession();

  try {

    session.startTransaction();

    logger.info(
      "Starting deleteProfileService"
    );

    if (!personId) {

      logger.warn(
        "personId missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "personId is required"
      );
    }

    const person =
      await getPersonById(
        personId
      );

    if (!person) {

      logger.warn(
        "Profile not found"
      );

      return buildResponse(
        DataConstant.NOT_FOUND,
        "Profile not found"
      );
    }

    if (
      person.relationType ===
      "HEAD"
    ) {

      logger.warn(
        "HEAD profile deletion attempted"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Family HEAD cannot be deleted"
      );
    }

    logger.info(
      "Soft deleting profile"
    );

    await updatePerson(
      personId,
      {
        status: 0,
      },
      session
    );

    logger.info(
      "Decrementing family members"
    );

    await decrementFamilyMembers(
      person.familyRefId,
      session
    );

    await session.commitTransaction();

    logger.info(
      "Profile deleted successfully"
    );

    return buildResponse(
      DataConstant.OK,
      DataConstant.PROFILE_DELETED,
      {
        deleted: true,
      }
    );

  } catch (error) {

    await session.abortTransaction();

    logger.error(
      "Error in deleteProfileService: %s",
      error.stack ||
        error.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );

  } finally {

    session.endSession();

    logger.info(
      "deleteProfileService session ended"
    );
  }
}

/* ───────────────── GET ALL PERSONS BY FAMILY ID ───────────────── */

async function getPersonsByFamilyIdService(
  familyId
) {

  try {

    logger.info(
      "Starting getPersonsByFamilyIdService"
    );

    /*
     * Validation
     */

    if (!familyId) {

      logger.warn(
        "familyId missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "familyId is required"
      );
    }

    /*
     * Fetch Persons
     */

    logger.info(
      "Fetching persons by familyId"
    );

    const persons =
      await getPersonsByFamilyId(
        familyId
      );

    if (
      !persons ||
      persons.length === 0
    ) {

      logger.warn(
        "No profiles found"
      );

      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.RECORD_NOT_FOUND
      );
    }

    /*
     * Required Response
     */

const response =
  persons.map((person) => ({

    id: person._id,

    name: `${person.firstName || ""} ${person.lastName || ""}`
      .trim(),

    profileImage:
      person.profileImage &&
      person.profileImage.trim() !== ""
        ? person.profileImage
        : null,

  }));

    logger.info(
      "Profiles fetched successfully"
    );

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      response
    );

  } catch (error) {

    logger.error(
      "Error in getPersonsByFamilyIdService: %s",
      error.stack ||
        error.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

async function blockUnblockPersonService(
  id,
  status
) {
  try {
    logger.info(
      "blockUnblockPersonService called id=%s status=%s",
      id,
      status
    );

    if (!id) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "id is required",
        null
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Invalid id",
        null
      );
    }

    if (
      status === undefined ||
      status === null ||
      status === ""
    ) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "status is required",
        null
      );
    }

    const numericStatus =
      Number(status);

    if (![0, 1, 2].includes(numericStatus)) {
      return buildResponse(
        DataConstant.BAD_REQUEST,
        "status must be 0, 1 or 2",
        null
      );
    }

    const person =
      await getPersonById(id);

    if (!person) {
      return buildResponse(
        DataConstant.NOT_FOUND,
        "Record not found.",
        null
      );
    }

    if (person.status === numericStatus) {
      if (numericStatus === 1) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Person already active.",
          null
        );
      }

      if (numericStatus === 2) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Person already inactive.",
          null
        );
      }

      if (numericStatus === 0) {
        return buildResponse(
          DataConstant.BAD_REQUEST,
          "Person already deleted.",
          null
        );
      }
    }

    person.status = numericStatus;
    await person.save();

    let message =
      "Person status updated successfully.";

    if (numericStatus === 0) {
      message =
        "Person deleted successfully.";
    }

    if (numericStatus === 1) {
      message =
        "Person activated successfully.";
    }

    if (numericStatus === 2) {
      message =
        "Person deactivated successfully.";
    }

    return buildResponse(
      DataConstant.OK,
      message,
      person
    );
  } catch (error) {
    logger.error(
      "Error in blockUnblockPersonService: %s",
      error.stack ||
        error.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE,
      null
    );
  }
}

module.exports = {
  createMemberProfileService,
  updateProfileService,
  getProfileByIdService,
  deleteProfileService,
  getPersonsByFamilyIdService,
  blockUnblockPersonService,
};
