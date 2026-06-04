const Family = require("../models/Family");

async function create(data) {
  return await new Family(data).save();
}

async function findByFamilyId(familyId) {
  return await Family.findOne({ familyId });
}

async function findById(id) {
  return await Family.findById(id);
}

async function updateByFamilyId(familyId, updateData) {
  return await Family.findOneAndUpdate(
    { familyId },
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
}

function findAll(query) {
  return Family.find(query);
}

async function countDocuments(query) {
  return await Family.countDocuments(query);
}

module.exports = {
  create,
  findByFamilyId,
  findById,
  updateByFamilyId,
  findAll,
  countDocuments,
};
