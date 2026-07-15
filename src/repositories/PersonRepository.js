const Person =
  require("../models/Person");

/* ───────────────── CREATE PERSON ───────────────── */

async function createPerson(
  payload,
  session = null
) {

  const person =
    await Person.create(
      [payload],
      { session }
    );

  return person[0];
}

/* ───────────────── UPDATE PERSON ───────────────── */

async function updatePerson(
  personId,
  payload,
  session = null
) {

  return await Person.findByIdAndUpdate(
    personId,
    payload,
    {
      new: true,
      session,
    }
  );
}

/* ───────────────── GET PERSON BY ID ───────────────── */

async function getPersonById(
  personId
) {

  return await Person.findOne({
    _id: personId,
    status: {
      $in: [1, 2],
    },
  });
}

/* ───────────────── GET PERSONS BY FAMILY ID ───────────────── */

async function getPersonsByFamilyId(
  familyId
) {

  return await Person.find({
    familyId,
    status: {
      $in: [1, 2],
    },
  }).sort({
    createdAt: 1,
  });
}

/* ───────────────── GET HEAD PERSON ───────────────── */

async function getHeadPersonByFamilyId(
  familyId
) {

  return await Person.findOne({
    familyId,
    relationType: "HEAD",
    status: {
      $in: [1, 2],
    },
  });
}

/* ───────────────── DELETE PERSON ───────────────── */

async function deletePerson(
  personId,
  session = null
) {

  return await Person.findByIdAndDelete(
    personId,
    {
      session,
    }
  );
}

module.exports = {
  createPerson,
  updatePerson,
  getPersonById,
  getPersonsByFamilyId,
  getHeadPersonByFamilyId,
  deletePerson,
};
