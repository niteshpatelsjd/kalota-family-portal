const User = require("../models/User");
const mongoose = require("mongoose");

async function createUser(data) {
  return await User.create(data);
}
async function findByMobileNumber(mobileNumber) {
  return await User.findOne({  mobileNumber: mobileNumber });
}
async function findById(id) {
  return await User.findById(id);
}

async function findByIds(ids) {
  // Convert only valid ids, skip invalid ones
  const objectIds = ids
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  return User.find({ _id: { $in: objectIds } });
}
async function updateUser(id, updateData) {
  return await User.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
}
async function findAllUsers(query, skip, pageSize) {
  try {
    // Ensure skip and limit are numbers
  

    const users = await User.find(query)
      .sort({ createdAt: -1 }) // DESC order
      .skip(skip)
      .limit(pageSize);

    return users;
  } catch (error) {
    throw new Error("Error fetching users: " + error.message);
  }
}
async function countDocuments(query){
   return await User.countDocuments(query);
}





module.exports = { createUser,
   findById,findByIds, updateUser,findByMobileNumber, findAllUsers,countDocuments };
