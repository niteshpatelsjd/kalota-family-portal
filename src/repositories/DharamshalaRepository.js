const Dharamshala =
  require("../models/Dharamshala");
  const DharamshalaCommittee =
  require("../models/DharamshalaCommittee");

/* ─────────────────────────────────────
   CREATE
───────────────────────────────────── */

async function createDharamshala(
  data
) {
  return await Dharamshala.create(
    data
  );
}

/* ─────────────────────────────────────
   UPDATE
───────────────────────────────────── */

async function updateDharamshala(
  id,
  data
) {
  return await Dharamshala.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
    }
  ).populate("villageId");
}

/* ─────────────────────────────────────
   FIND BY ID
───────────────────────────────────── */

async function findById(id) {
  return await Dharamshala.findById(
    id
  ).populate("villageId");
}

/* ─────────────────────────────────────
   FIND ALL
───────────────────────────────────── */

async function findAll(
  query,
  skip,
  limit
) {
  return await Dharamshala.find(
    query
  )
    .populate("villageId")
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit);
}

/* ─────────────────────────────────────
   COUNT
───────────────────────────────────── */

async function countDocuments(
  query
) {
  return await Dharamshala.countDocuments(
    query
  );
}

/* ─────────────────────────────────────
   FIND BY NAME
───────────────────────────────────── */

async function findByName(name) {
  return await Dharamshala.findOne({
    name: {
      $regex: `^${name}$`,
      $options: "i",
    },
    status: {
      $ne: 0,
    },
  });
}

async function findCommitteeByDharamshalaId(
  dharamshalaId
) {
  return DharamshalaCommittee.find({
    dharamshalaId,
    status: 1,
  })
    .populate({
      path: "userId",
      select: "name profileUrl mobileNumber",
    })
    .lean();
}
module.exports = {
    findCommitteeByDharamshalaId,
  createDharamshala,
  updateDharamshala,
  findById,
  findAll,
  countDocuments,
  findByName,
};