// controllers/DistrictController.js
const districtService = require("../services/DistrictService");

// Add District
exports.addDistrict = async (req, res) => {
  try {
    const district = await districtService.addDistrict(req.body);
    res.json(district);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get District By ID
exports.getDistrictById = async (req, res) => {
  try {
    const district = await districtService.getDistrictById(req.query.districtId);
    res.json(district);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get District By Name
exports.getDistrictByName = async (req, res) => {
  try {
    const district = await districtService.getDistrictByName(req.query.name);
    res.json(district);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get District Info
exports.getDistrictInfo = async (req, res) => {
  try {
    const district = await districtService.getDistrictById(req.query.districtId);
    res.json(district);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Districts
exports.getAllDistricts = async (req, res) => {
  try {
    const { pageIndex, pageSize, status, searchText } = req.query;

    const districts = await districtService.getAllDistrict(
      pageIndex,
      pageSize,
      status,
      searchText
    );

    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Block/Unblock District
exports.blockUnblockDistrict = async (req, res) => {
  try {
    const { id, status } = req.body;

    const district = await districtService.blockUnblockDistrict(
      id,
      status
    );

    res.json(district);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};