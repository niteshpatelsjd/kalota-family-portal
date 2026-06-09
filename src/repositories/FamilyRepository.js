// repositories/FamilyRepository.js
const logger = require("../utils/logger");

const mongoose = require("mongoose");
const Family =
  require("../models/Family");

const Person =
  require("../models/Person");

/* ───────────────── FIND FAMILY BY FAMILY ID ───────────────── */

async function findFamilyByFamilyId(
  familyId
) {

  return await Family.findOne({
    familyId,
  });
}

/* ───────────────── INCREMENT FAMILY MEMBERS ───────────────── */

async function incrementFamilyMembers(
  familyRefId,
  session
) {

  return await Family.findByIdAndUpdate(
    familyRefId,
    {
      $inc: {
        totalMembers: 1,
      },
    },
    {
      new: true,
      session,
    }
  );
}

/* ───────────────── DECREMENT FAMILY MEMBERS ───────────────── */

async function decrementFamilyMembers(
  familyId,
  session = null
) {

  return await Family.findByIdAndUpdate(
    familyId,
    {
      $inc: {
        totalMembers: -1,
      },
    },
    {
      new: true,
      session,
    }
  );
}

/* ───────────────── FIND DUPLICATE FAMILY ───────────────── */


async function findDuplicateFamily({
  firstName,
  lastName,
  fatherFirstName,
  motherFirstName,
  dob,
  villageId,
}) {

  logger.info(
    "Running duplicate family query"
  );

  return await Person.findOne({

    relationType: "HEAD",

    firstName: {
      $regex: firstName.trim(),
      $options: "i",
    },

    lastName: {
      $regex: `^${lastName.trim()}$`,
      $options: "i",
    },

    fatherFirstName: {
      $regex: fatherFirstName.trim(),
      $options: "i",
    },

    motherFirstName: {
      $regex: motherFirstName.trim(),
      $options: "i",
    },

    dob: dob.trim(),

    villageId:
      new mongoose.Types.ObjectId(
        villageId
      ),

    status: 1,
  });
}



/* ───────────────── CREATE FAMILY ───────────────── */

async function createFamily(
  payload,
  session = null
) {

  const family =
    await Family.create(
      [payload],
      { session }
    );

  return family[0];
}

/* ───────────────── GET FAMILY COUNT ───────────────── */

async function getFamilyCount() {

  return await Family.countDocuments();
}

module.exports = {
  findFamilyByFamilyId,
  incrementFamilyMembers,
  decrementFamilyMembers,
  findDuplicateFamily,
  createFamily,
  getFamilyCount,
};