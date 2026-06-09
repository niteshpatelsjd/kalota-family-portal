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
    status: 1,
  });
}

/* ───────────────── GET PERSONS BY FAMILY ID ───────────────── */

async function getPersonsByFamilyId(
  familyId
) {

  return await Person.find({
    familyId,
    status: 1,
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
    status: 1,
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