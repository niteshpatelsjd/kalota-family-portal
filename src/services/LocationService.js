const locationRepo = require("../repositories/LocationRepository");
const buildResponse = require("../utils/response");

async function addLocation(data) {
  try {
    const { id, district, tehsil, village, latitude, longitude, status } = data;

    if (!district || !tehsil || !village) {
      return buildResponse(400, "district, tehsil and village are required", null);
    }

    if (id && id.trim() !== "") {
      const updated = await locationRepo.update(id, { district, tehsil, village, latitude, longitude, status, updatedAt: new Date() });
      if (!updated) return buildResponse(404, "Location not found", null);
      return buildResponse(200, "Location updated successfully", buildLocationResponse(updated));
    }

    const created = await locationRepo.create({ district, tehsil, village, latitude, longitude });
    return buildResponse(201, "Location added successfully", buildLocationResponse(created));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function getLocationById(id) {
  try {
    const location = await locationRepo.findById(id);
    if (!location) return buildResponse(404, "Location not found", null);
    return buildResponse(200, "Record found successfully", buildLocationResponse(location));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

async function getAllLocations({ pageIndex = 0, pageSize = 10, searchText, district, tehsil }) {
  try {
    const query = { status: { $ne: 0 } };

    if (district) query.district = { $regex: district.trim(), $options: "i" };
    if (tehsil)   query.tehsil   = { $regex: tehsil.trim(),   $options: "i" };

    if (searchText && searchText.trim()) {
      query.$or = [
        { district: { $regex: searchText.trim(), $options: "i" } },
        { tehsil:   { $regex: searchText.trim(), $options: "i" } },
        { village:  { $regex: searchText.trim(), $options: "i" } },
      ];
    }

    const skip = pageIndex * pageSize;
    const [records, totalRecords] = await Promise.all([
      locationRepo.findAll(query).skip(skip).limit(pageSize),
      locationRepo.countDocuments(query),
    ]);

    if (!records.length) return buildResponse(404, "No records found", null);

    return buildResponse(200, "Records fetched successfully", {
      content: records.map(buildLocationResponse),
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

async function blockUnblock(id, status) {
  try {
    const location = await locationRepo.findById(id);
    if (!location) return buildResponse(404, "Location not found", null);

    const updated = await locationRepo.update(id, { status });
    const messages = { 0: "Location deleted successfully", 1: "Location activated successfully", 2: "Location deactivated successfully" };
    return buildResponse(200, messages[status] || "Status updated", buildLocationResponse(updated));
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

// Dropdown: distinct districts
async function getDistricts() {
  try {
    const districts = await locationRepo.findDistinct("district", { status: 1 });
    return buildResponse(200, "Districts fetched successfully", districts.sort());
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

// Dropdown: tehsils by district
async function getTehsilsByDistrict(district) {
  try {
    if (!district) return buildResponse(400, "district is required", null);
    const tehsils = await locationRepo.findDistinct("tehsil", { district, status: 1 });
    return buildResponse(200, "Tehsils fetched successfully", tehsils.sort());
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

// Dropdown: villages by district + tehsil
async function getVillagesByTehsil(district, tehsil) {
  try {
    if (!district || !tehsil) return buildResponse(400, "district and tehsil are required", null);
    const villages = await locationRepo.findDistinctAndTehsil("village",{ district, tehsil, status: 1 });
    // const result = villages.map((v) => ({
    //   id: v._id,
    //   village: v.village,
    //   latitude: v.latitude,
    //   longitude: v.longitude,
    // }));
    return buildResponse(200, "Villages fetched successfully", villages.sort());
  } catch (err) {
    return buildResponse(500, err.message, null);
  }
}

function buildLocationResponse(loc) {
  if (!loc) return null;
  return {
    id: loc._id,
    district: loc.district,
    tehsil: loc.tehsil,
    village: loc.village,
    latitude: loc.latitude,
    longitude: loc.longitude,
    status: loc.status,
    createdAt: loc.createdAt,
    updatedAt: loc.updatedAt,
  };
}

module.exports = { addLocation, getLocationById, getAllLocations, blockUnblock, getDistricts, getTehsilsByDistrict, getVillagesByTehsil };
