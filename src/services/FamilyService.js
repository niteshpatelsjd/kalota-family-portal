const familyRepo = require("../repositories/FamilyRepository");
const familyProfileRepo = require("../repositories/FamilyProfileRepository");
const buildResponse = require("../utils/response");

async function createFamily(data) {
  try {
    const { headProfile, profiles = [] } = data || {};

    if (!headProfile || !headProfile.name || !headProfile.district || !headProfile.tehsil || !headProfile.village) {
      return buildResponse(400, "headProfile with name, district, tehsil and village is required", null);
    }

    const familyId = data.familyId || await generateFamilyId(
      headProfile.district,
      headProfile.tehsil,
      headProfile.village
    );

    const existing = await familyRepo.findByFamilyId(familyId);
    if (existing) {
      return buildResponse(409, "FamilyId already exists", null);
    }

    const head = await familyProfileRepo.create({
      ...headProfile,
      familyId,
      relationToHead: "HEAD",
      gender: headProfile.gender || "MALE",
      district: headProfile.district,
      tehsil: headProfile.tehsil,
      village: headProfile.village,
    });

    const family = await familyRepo.create({
      familyId,
      headProfileId: head._id,
      district: headProfile.district,
      tehsil: headProfile.tehsil,
      village: headProfile.village,
    });

    const validProfiles = profiles
      .filter((profile) => profile && profile.name && profile.relationToHead)
      .map((profile) => ({
        ...profile,
        familyId,
      }));

    if (validProfiles.length) {
      await familyProfileRepo.insertMany(validProfiles);
    }

    const familyDetails = await getFamilyDetails(family.familyId);
    return buildResponse(201, "Family created successfully", familyDetails.responseBody);
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function addProfile(data) {
  try {
    if (!data.familyId || !data.name || !data.relationToHead) {
      return buildResponse(400, "familyId, name and relationToHead are required", null);
    }

    const family = await familyRepo.findByFamilyId(data.familyId);
    if (!family) return buildResponse(404, "Family not found", null);

    const profile = await familyProfileRepo.create(data);
    return buildResponse(201, "Family profile added successfully", buildProfileResponse(profile));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function updateProfile(id, data) {
  try {
    const profile = await familyProfileRepo.update(id, data);
    if (!profile) return buildResponse(404, "Family profile not found", null);
    return buildResponse(200, "Family profile updated successfully", buildProfileResponse(profile));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function getFamilyDetails(familyId) {
  try {
    const family = await familyRepo.findByFamilyId(familyId);
    if (!family) return buildResponse(404, "Family not found", null);

    const profiles = await familyProfileRepo.findByFamilyId(familyId);
    return buildResponse(200, "Family details fetched successfully", {
      family: buildFamilyResponse(family),
      profiles: profiles.map(buildProfileResponse),
    });
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function getAllFamilies({ pageIndex = 0, pageSize = 10, searchText, district, tehsil, village }) {
  try {
    const query = { status: { $ne: 0 } };

    if (district) query.district = { $regex: district.trim(), $options: "i" };
    if (tehsil) query.tehsil = { $regex: tehsil.trim(), $options: "i" };
    if (village) query.village = { $regex: village.trim(), $options: "i" };

    if (searchText && searchText.trim()) {
      query.$or = [
        { familyId: { $regex: searchText.trim(), $options: "i" } },
        { district: { $regex: searchText.trim(), $options: "i" } },
        { tehsil: { $regex: searchText.trim(), $options: "i" } },
        { village: { $regex: searchText.trim(), $options: "i" } },
      ];
    }

    const skip = pageIndex * pageSize;
    const [families, totalRecords] = await Promise.all([
      familyRepo.findAll(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("headProfileId"),
      familyRepo.countDocuments(query),
    ]);

    if (!families.length) return buildResponse(404, "No records found", null);

    return buildResponse(200, "Families fetched successfully", {
      content: families.map(buildFamilyListResponse),
      pageIndex,
      pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      hasNext: pageIndex + 1 < Math.ceil(totalRecords / pageSize),
      hasPrevious: pageIndex > 0,
    });
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function searchFamiliesForRegistration({ district, tehsil, village, searchText }) {
  try {
    const query = { status: 1 };
    if (district) query.district = district;
    if (tehsil) query.tehsil = tehsil;
    if (village) query.village = village;
    if (searchText && searchText.trim()) {
      query.$or = [
        { familyId: { $regex: searchText.trim(), $options: "i" } },
        { district: { $regex: searchText.trim(), $options: "i" } },
        { tehsil: { $regex: searchText.trim(), $options: "i" } },
        { village: { $regex: searchText.trim(), $options: "i" } },
      ];
    }

    const families = await familyRepo.findAll(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("headProfileId");

    return buildResponse(200, "Families fetched successfully", families.map(buildFamilyOptionResponse));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function blockUnblockFamily(familyId, status) {
  try {
    const family = await familyRepo.updateByFamilyId(familyId, { status });
    if (!family) return buildResponse(404, "Family not found", null);

    const messages = {
      0: "Family deleted successfully",
      1: "Family activated successfully",
      2: "Family deactivated successfully",
    };

    return buildResponse(200, messages[status] || "Family status updated", buildFamilyResponse(family));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function generateFamilyId(district, tehsil, village) {
  const prefix = `KFP-${code(district)}-${code(tehsil)}-${code(village)}`;
  const count = await familyRepo.countDocuments({ familyId: { $regex: `^${prefix}` } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

function code(value = "") {
  return value.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "XXX";
}

function buildFamilyResponse(family) {
  if (!family) return null;
  return {
    id: family._id,
    familyId: family.familyId,
    headProfileId: family.headProfileId?._id || family.headProfileId,
    district: family.district,
    tehsil: family.tehsil,
    village: family.village,
    status: family.status,
    createdAt: family.createdAt,
    updatedAt: family.updatedAt,
  };
}

function buildFamilyListResponse(family) {
  const head = family.headProfileId;
  return {
    ...buildFamilyResponse(family),
    headName: head?.name || "",
    headFatherName: head?.fatherName || "",
    displayName: `${head?.name || "Head"} - ${head?.fatherName || "Father"} - ${family.village}`,
  };
}

function buildFamilyOptionResponse(family) {
  return {
    familyId: family.familyId,
    headName: family.headProfileId?.name || "",
    headFatherName: family.headProfileId?.fatherName || "",
    district: family.district,
    tehsil: family.tehsil,
    village: family.village,
    displayName: `${family.headProfileId?.name || "Head"} - ${family.headProfileId?.fatherName || "Father"} - ${family.village}`,
  };
}

function buildProfileResponse(profile) {
  if (!profile) return null;
  return {
    id: profile._id,
    familyId: profile.familyId,
    relationToHead: profile.relationToHead,
    name: profile.name,
    dob: profile.dob,
    gender: profile.gender,
    isMarried: profile.isMarried,
    profileImage: profile.profileImage,
    occupation: profile.occupation,
    education: profile.education,
    mobileNumber: profile.mobileNumber,
    email: profile.email,
    fatherName: profile.fatherName,
    motherName: profile.motherName,
    grandFatherName: profile.grandFatherName,
    district: profile.district,
    tehsil: profile.tehsil,
    village: profile.village,
    parentProfileId: profile.parentProfileId,
    spouseDetails: profile.spouseDetails,
    spouseFamilyId: profile.spouseFamilyId,
    linkedMemberId: profile.linkedMemberId,
    status: profile.status,
  };
}

module.exports = {
  createFamily,
  addProfile,
  updateProfile,
  getFamilyDetails,
  getAllFamilies,
  searchFamiliesForRegistration,
  blockUnblockFamily,
  buildProfileResponse,
};
