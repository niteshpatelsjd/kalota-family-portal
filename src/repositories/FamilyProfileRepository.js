const FamilyProfile = require("../models/FamilyProfile");

async function create(data) {
  return await new FamilyProfile(data).save();
}

async function insertMany(records) {
  return await FamilyProfile.insertMany(records);
}

async function findById(id) {
  return await FamilyProfile.findById(id);
}

async function findByFamilyId(familyId) {
  return await FamilyProfile.find({ familyId, status: { $ne: 0 } }).sort({
    relationToHead: 1,
    createdAt: 1,
  });
}

async function findHeadByFamilyId(familyId) {
  return await FamilyProfile.findOne({
    familyId,
    relationToHead: "HEAD",
    status: { $ne: 0 },
  });
}

async function update(id, updateData) {
  return await FamilyProfile.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
}

async function findPossibleProfileMatch({ familyId, name, fatherName, dob }) {
  const query = {
    familyId,
    status: { $ne: 0 },
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  };

  if (fatherName) {
    query.fatherName = { $regex: `^${escapeRegex(fatherName)}$`, $options: "i" };
  }

  if (dob) {
    const date = new Date(dob);
    if (!Number.isNaN(date.getTime())) {
      query.dob = date;
    }
  }

  return await FamilyProfile.findOne(query);
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  create,
  insertMany,
  findById,
  findByFamilyId,
  findHeadByFamilyId,
  update,
  findPossibleProfileMatch,
};
