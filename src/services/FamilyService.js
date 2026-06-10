
const mongoose = require("mongoose");

const Family = require("../models/Family");
const Village = require("../models/Village");
const Person = require("../models/Person");

const logger = require("../utils/logger");
const buildResponse = require("../utils/response");

const {
  findDuplicateFamily,
  createFamily,
  findFamilyByFamilyId,
  incrementFamilyMembers,
  decrementFamilyMembers,
} = require("../repositories/FamilyRepository");

const {
  createPerson,
  updatePerson,
  deletePerson,
  getPersonById,
  getPersonsByFamilyId,
} = require("../repositories/PersonRepository");

const {
  generateFamilyId,
} = require("../utils/GenerateFamilyId");

const {
  uploadFile,
} = require("../utils/FileUtil");

const DataConstant = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,

  SHORT_ZERO: 0,
  SHORT_ONE: 1,
  SHORT_TWO: 2,

  FAMILY_CREATED:
    "Family created successfully",

  FAMILY_NOT_FOUND:
    "Family not found",

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

/* ───────────────── CREATE FAMILY HEAD ───────────────── */

async function createFamilyHead(
  body,
  file
) {

  const session =
    await mongoose.startSession();

  try {

    session.startTransaction();

    logger.info(
      "Starting createFamilyHead service"
    );

    const {
      firstName,
      middleName,
      lastName,

      fatherFirstName,
      fatherMiddleName,
      fatherLastName,

      motherFirstName,
      motherMiddleName,
      motherLastName,

      gender,
      dob,
      mobile,
      email,
      occupation,
      education,
      maritalStatus,
      villageId,
    } = body;

    /*
     * Validate Required Fields
     */

    if (!firstName) {

      logger.warn(
        "Validation failed: firstName is missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "First name is required"
      );
    }

    if (!lastName) {

      logger.warn(
        "Validation failed: lastName is missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Last name is required"
      );
    }

    if (!fatherFirstName) {

      logger.warn(
        "Validation failed: fatherFirstName is missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Father first name is required"
      );
    }

    if (!motherFirstName) {

      logger.warn(
        "Validation failed: motherFirstName is missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Mother first name is required"
      );
    }

    if (!gender) {

      logger.warn(
        "Validation failed: gender is missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Gender is required"
      );
    }

    if (!dob) {

      logger.warn(
        "Validation failed: dob is missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Date of birth is required"
      );
    }

    if (!villageId) {

      logger.warn(
        "Validation failed: villageId is missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Village Id is required"
      );
    }

    /*
     * Validate Village
     */

    logger.info(
      "Fetching village details for villageId: %s",
      villageId
    );

    const village =
      await Village.findById(
        villageId
      );

    if (!village) {

      logger.warn(
        "Village not found for villageId: %s",
        villageId
      );

      return buildResponse(
        DataConstant.NOT_FOUND,
        "Village not found"
      );
    }

    logger.info(
      "Village validated successfully"
    );

    /*
     * Check Duplicate Family
     */

logger.info(
  "Checking duplicate family",
  {
    firstName,
    lastName,
    fatherFirstName,
    motherFirstName,
    dob,
    villageId,
  }
);

const duplicate =
  await findDuplicateFamily({
    firstName,
    lastName,
    fatherFirstName,
    motherFirstName,
    dob,
    villageId,
  });
    if (duplicate) {

      logger.warn(
        "Duplicate family found with familyId: %s",
        duplicate.familyId
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        `Family already exists with Family ID: ${duplicate.familyId}`
      );
    }

    logger.info(
      "No duplicate family found"
    );

    /*
     * Upload Profile Image
     */

    let profileImage =
      null;

    if (file) {

      logger.info(
        "Uploading profile image"
      );

      profileImage =
        await uploadFile(
          file,
          "family-profile"
        );

      logger.info(
        "Profile image uploaded successfully"
      );
    }

    /*
     * Generate Family ID
     */

    logger.info(
      "Generating familyId"
    );

    const familyId =
      await generateFamilyId(
        village.districtId,
        village.tehsilId,
        village._id
      );

    logger.info(
      "Generated familyId: %s",
      familyId
    );

    /*
     * Create HEAD Person
     */

    logger.info(
      "Creating HEAD profile"
    );

    const headPerson =
      await createPerson(
        {
          familyId,

          relationType:
            "HEAD",

          firstName,
          middleName,
          lastName,

          fatherFirstName,
          fatherMiddleName,
          fatherLastName,

          motherFirstName,
          motherMiddleName,
          motherLastName,

          gender,

          dob,

          mobile,

          email,

          occupation,

          education,

          maritalStatus,

          villageId:
            village._id,

          profileImage,
        },
        session
      );

    logger.info(
      "HEAD profile created successfully with personId: %s",
      headPerson._id
    );

    /*
     * Create Family
     */

    logger.info(
      "Creating family record"
    );

    const family =
      await createFamily(
        {
          familyId,

          familyTitle:
            `${firstName} ${lastName} Family`,

          familyHeadId:
            headPerson._id,

          districtId:
            village.districtId,

          tehsilId:
            village.tehsilId,
          villageId:
            village._id,

          totalMembers: 1,
        },
        session
      );

    logger.info(
      "Family created successfully with familyRefId: %s",
      family._id
    );

    /*
     * Update Head References
     */

    logger.info(
      "Updating family references in HEAD profile"
    );

    await updatePerson(
      headPerson._id,
      {
        familyRefId:
          family._id,

        familyHeadId:
          headPerson._id,
      },
      session
    );

    logger.info(
      "HEAD profile references updated successfully"
    );

    /*
     * Commit Transaction
     */

    await session.commitTransaction();

    logger.info(
      "createFamilyHead transaction committed successfully"
    );

    return buildResponse(
      DataConstant.OK,
      DataConstant.FAMILY_CREATED,
      family
    );

  } catch (err) {

    await session.abortTransaction();

    logger.error(
      "Error in createFamilyHead: %s",
      err.stack || err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );

  } finally {

    session.endSession();

    logger.info(
      "createFamilyHead session ended"
    );
  }
}

async function createOrUpdateFamilyHead(
  body,
  file
) {

  const {
    familyRefId,
  } = body;

  if (familyRefId) {

    return await updateFamilyHead(
      body,
      file
    );
  }

  return await createFamilyHead(
    body,
    file
  );
}

async function updateFamilyHead(
  body,
  file
) {

  const session =
    await mongoose.startSession();

  try {

    session.startTransaction();

    logger.info(
      "Starting updateFamilyHead service"
    );

    const {
      familyRefId,

      firstName,
      middleName,
      lastName,

      fatherFirstName,
      fatherMiddleName,
      fatherLastName,

      motherFirstName,
      motherMiddleName,
      motherLastName,

      gender,
      dob,
      mobile,
      email,
      occupation,
      education,
      maritalStatus,
      villageId,
    } = body;

    /*
     * Validate familyRefId
     */

    if (!familyRefId) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "familyRefId is required"
      );
    }

    /*
     * Find Existing Family
     */

    const family =
      await Family.findById(
        familyRefId
      );

    if (!family) {

      return buildResponse(
        DataConstant.NOT_FOUND,
        "Family not found"
      );
    }

    /*
     * Find Family Head
     */

    const headPerson =
      await Person.findById(
        family.familyHeadId
      );

    if (!headPerson) {

      return buildResponse(
        DataConstant.NOT_FOUND,
        "Family head not found"
      );
    }

    /*
     * Validate Required Fields
     */

    if (!firstName) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "First name is required"
      );
    }

    if (!lastName) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Last name is required"
      );
    }

    if (!fatherFirstName) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Father first name is required"
      );
    }

    if (!motherFirstName) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Mother first name is required"
      );
    }

    if (!gender) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Gender is required"
      );
    }

    if (!dob) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "DOB is required"
      );
    }

    if (!villageId) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Village Id is required"
      );
    }

    /*
     * Validate Village
     */

    const village =
      await Village.findById(
        villageId
      );

    if (!village) {

      return buildResponse(
        DataConstant.NOT_FOUND,
        "Village not found"
      );
    }

    /*
     * Check Duplicate Family
     */

    const duplicate =
      await findDuplicateFamily({
        firstName,
        lastName,
        fatherFirstName,
        motherFirstName,
        dob,
        villageId,
      });

    if (
      duplicate &&
      duplicate._id.toString() !==
        familyRefId.toString()
    ) {

      return buildResponse(
        DataConstant.BAD_REQUEST,
        `Family already exists with Family ID: ${duplicate.familyId}`
      );
    }

    /*
     * Upload Image
     */

    let profileImage =
      headPerson.profileImage || null;

    if (file) {

      profileImage =
        await uploadFile(
          file,
          "family-profile"
        );
    }

    /*
     * Update Person
     */

    await updatePerson(
      headPerson._id,
      {
        firstName,
        middleName,
        lastName,

        fatherFirstName,
        fatherMiddleName,
        fatherLastName,

        motherFirstName,
        motherMiddleName,
        motherLastName,

        gender,

        dob,

        mobile,

        email,

        occupation,

        education,

        maritalStatus,

        villageId:
          village._id,

        profileImage,
      },
      session
    );

    /*
     * Update Family
     */

    await Family.findByIdAndUpdate(
      family._id,
      {
        familyTitle:
          `${firstName} ${lastName} Family`,

        districtId:
          village.districtId,

        tehsilId:
          village.tehsilId,

        villageId:
          village._id,
      },
      {
        session,
      }
    );

    /*
     * Commit Transaction
     */

    await session.commitTransaction();

    logger.info(
      "Family updated successfully"
    );

    return buildResponse(
      DataConstant.OK,
      "Family updated successfully"
    );

  } catch (err) {

    await session.abortTransaction();

    logger.error(
      "Error in updateFamilyHead: %s",
      err.stack || err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );

  } finally {

    session.endSession();

    logger.info(
      "updateFamilyHead session ended"
    );
  }
}
/* ───────────────── CHECK DUPLICATE FAMILY ───────────────── */

async function checkDuplicateFamily(
  body
) {

  try {



    const {
      firstName,
      lastName,
      fatherFirstName,
      motherFirstName,
      dob,
      villageId,
    } = body;

    /*
     * Validation
     */

    if (!firstName) {

      logger.warn(
        "First name missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "First name is required"
      );
    }

    if (!lastName) {

      logger.warn(
        "Last name missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Last name is required"
      );
    }

    if (!villageId) {

      logger.warn(
        "Village Id missing"
      );

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "Village Id is required"
      );
    }

    /*
     * Validate Village
     */

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
     * Find Duplicate
     */

    logger.info(
  "Duplicate search payload: %j",
  {
    firstName,
    lastName,
    fatherFirstName,
    motherFirstName,
    dob,
    villageId,
  }
);
    const duplicate =
      await findDuplicateFamily({

        firstName,

        lastName,

        fatherFirstName,

        motherFirstName,

        dob,

        villageId:
          village._id,
      });

    /*
     * No Duplicate
     */

    logger.info(
      "Duplicate query result: %j",
      duplicate
    );
    if (!duplicate) {

      logger.info(
        "No duplicate family found"
      );

      return buildResponse(
        DataConstant.OK,
        "No duplicate family found",
        {
          isDuplicate: false,
        }
      );
    }

    /*
     * Duplicate Found
     */

    logger.warn(
      "Duplicate family exists"
    );

    return buildResponse(
      DataConstant.OK,
      "Duplicate family found",
      {
        isDuplicate: true,

        familyId:
          duplicate.familyId,

        existingHead:
          duplicate,
      }
    );

  } catch (err) {

    logger.error(
      "Error in checkDuplicateFamily: %s",
      err.stack || err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}


/* ───────────────── GET FAMILY PROFILE ───────────────── */

async function getFamilyProfileById(familyId) {

  try {

    logger.info("Fetching family profile");

    if (!familyId) {

      logger.warn("familyId missing");

      return buildResponse(
        DataConstant.BAD_REQUEST,
        "familyId is required"
      );
    }

    const family =
      await findFamilyByFamilyId(familyId);

    if (!family) {

      logger.warn("Family not found");

      return buildResponse(
        DataConstant.NOT_FOUND,
        DataConstant.FAMILY_NOT_FOUND
      );
    }

    const members =
      await getPersonsByFamilyId(familyId);

    // =====================================
    // Add village names + spouse names
    // =====================================

    const updatedMembers = await Promise.all(

      members.map(async (memberDoc) => {

        // Convert mongoose document
        const member =
          memberDoc.toObject();

        const relationType =
          member.relationType?.toUpperCase();

        // Default values
        member.nativeVillageName = "";
        member.marriedVillageName = "";
        member.husbandName = "";
        member.wifeName = "";

        // =====================================
        // MOTHER & SPOUSE
        // -> nativeVillageName
        // =====================================

        if (
          relationType === "MOTHER" ||
          relationType === "SPOUSE"
        ) {

          if (member.parentVillageId) {

            const villageData =
              await Village.findById(
                member.parentVillageId
              );

            member.nativeVillageName =
              villageData?.name || "";
          }
        }

        // =====================================
        // SISTER / DAUGHTER / GRANDDAUGHTER
        // -> marriedVillageName
        // =====================================

        if (
          relationType === "SISTER" ||
          relationType === "DAUGHTER" ||
          relationType === "GRANDDAUGHTER"
        ) {

          if (
            member.maritalStatus === "MARRIED" &&
            member.parentVillageId
          ) {

            const villageData =
              await Village.findById(
                member.parentVillageId
              );

            member.marriedVillageName =
              villageData?.name || "";
          }
        }

        // =====================================
        // Husband / Wife Name
        // =====================================

        if (
          member.spouseIds &&
          member.spouseIds.length > 0
        ) {

          const spouse =
            await Person.findById(
              member.spouseIds[0]
            );

          if (spouse) {

            const spouseFullName = [

              spouse.firstName,
              spouse.middleName,
              spouse.lastName

            ]
              .filter(Boolean)
              .join(" ");

            // FEMALE -> Husband Name
            if (
              member.gender === "FEMALE"
            ) {

              member.husbandName =
                spouseFullName;
            }

            // MALE -> Wife Name
            if (
              member.gender === "MALE"
            ) {

              member.wifeName =
                spouseFullName;
            }
          }
        }

        return member;
      })
    );

    logger.info(
      "Family profile fetched successfully"
    );

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      {
        family,
        members: updatedMembers,
      }
    );

  } catch (err) {

    logger.error(
      "Error in getFamilyProfileById: %s",
      err.stack || err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}

/* ───────────────── GET ALL FAMILIES ───────────────── */

async function getAllFamilies(
  pageIndex,
  pageSize,
  status,
  searchText,
  districtId,
  tehsilId,
  villageId
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

    /* ───────── FILTER BY DISTRICT ───────── */

    if (districtId) {
      query.districtId = districtId;
    }

    /* ───────── FILTER BY TEHSIL ───────── */

    if (tehsilId) {
      query.tehsilId = tehsilId;
    }

    /* ───────── FILTER BY VILLAGE ───────── */

    if (villageId) {
      query.villageId = villageId;
    }

    /* ───────── FILTER BY STATUS ───────── */

    if (
      status !== undefined &&
      status !== null &&
      status !== ""
    ) {

      const parsedStatus =
        parseInt(status, 10);

      if (!isNaN(parsedStatus)) {
        query.status = parsedStatus;
      }
    }

    /* ───────── SEARCH ───────── */

    if (
      searchText &&
      searchText.trim() !== ""
    ) {

      query.$or = [
        {
          familyId: {
            $regex:
              searchText.trim(),
            $options: "i",
          },
        },

        {
          familyTitle: {
            $regex:
              searchText.trim(),
            $options: "i",
          },
        },
      ];
    }

    /* ───────── PAGINATION ───────── */

    pageIndex =
      parseInt(pageIndex) || 0;

    pageSize =
      parseInt(pageSize) || 10;

    const skip =
      pageIndex * pageSize;

    /* ───────── FETCH DATA ───────── */

    const [data, total] =
      await Promise.all([

        Family.find(query)

          .populate("districtId")

          .populate("tehsilId")

          .populate("villageId")

          .populate(
            "familyHeadId"
          )

          .sort({
            createdAt: -1,
          })

          .skip(skip)

          .limit(pageSize),

        Family.countDocuments(
          query
        ),
      ]);

    /* ───────── TOTAL COUNTS ───────── */

    const [
      totalFamilies,
      totalActive,
      totalInactive,
    ] = await Promise.all([

      Family.countDocuments(),

      Family.countDocuments({
        status:
          DataConstant.SHORT_ONE,
      }),

      Family.countDocuments({
        status:
          DataConstant.SHORT_TWO,
      }),
    ]);

    /* ───────── FORMAT RESPONSE ───────── */

    const formattedData =
      data.map((item) => ({

        id: item._id,

        familyId:
          item.familyId,

        familyTitle:
          item.familyTitle,

        totalMembers:
          item.totalMembers,

        status:
          item.status,

        familyHead:
          item.familyHeadId
            ? {
                id:
                  item
                    .familyHeadId
                    ._id,

                firstName:
                  item
                    .familyHeadId
                    .firstName,

                middleName:
                  item
                    .familyHeadId
                    .middleName,

                lastName:
                  item
                    .familyHeadId
                    .lastName,

                mobile:
                  item
                    .familyHeadId
                    .mobile,

                profileImage:
                  item
                    .familyHeadId
                    .profileImage,
              }
            : null,

        district:
          item.districtId
            ? {
                id:
                  item
                    .districtId
                    ._id,

                name:
                  item
                    .districtId
                    .name,
              }
            : null,

        tehsil:
          item.tehsilId
            ? {
                id:
                  item
                    .tehsilId
                    ._id,

                name:
                  item
                    .tehsilId
                    .name,
              }
            : null,

        village:
          item.villageId
            ? {
                id:
                  item
                    .villageId
                    ._id,

                name:
                  item
                    .villageId
                    .name,
              }
            : null,

        createdAt:
          item.createdAt,

        updatedAt:
          item.updatedAt,
      }));

    /* ───────── RETURN RESPONSE ───────── */

    return buildResponse(
      DataConstant.OK,
      DataConstant.RECORD_FOUND,
      {
        content:
          formattedData,

        pageIndex,

        pageSize,

        total,

        totalPages:
          Math.ceil(
            total / pageSize
          ),

        hasNext:
          skip +
            data.length <
          total,

        hasPrevious:
          pageIndex > 0,

        // EXTRA COUNTS
        totalFamilies,

        totalActive,

        totalInactive,
      }
    );

  } catch (err) {

    logger.error(
      "Error in getAllFamilies: %s",
      err.stack ||
        err.message
    );

    return buildResponse(
      DataConstant.SERVER_ERROR,
      DataConstant.SERVER_MESSAGE
    );
  }
}
module.exports = {
  createOrUpdateFamilyHead,
  createFamilyHead,
  checkDuplicateFamily,
  getFamilyProfileById,
  getAllFamilies,
};
