const Member = require("../models/Member");

async function create(data) {
  return await new Member(data).save();
}

async function findByMobileNumber(mobileNumber) {
  return await Member.findOne({ mobileNumber });
}

async function findById(id) {
  return await Member.findById(id);
}

async function findApprovedByMatchedProfileId(matchedProfileId) {
  if (!matchedProfileId) return null;
  return await Member.findOne({
    matchedProfileId,
    approvalStatus: "APPROVED",
    status: { $ne: 0 },
  });
}

async function update(id, updateData) {
  return await Member.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
}

function findAll(query) {
  return Member.find(query);
}

async function countDocuments(query) {
  return await Member.countDocuments(query);
}

module.exports = {
  create,
  findByMobileNumber,
  findById,
  findApprovedByMatchedProfileId,
  update,
  findAll,
  countDocuments,
};
