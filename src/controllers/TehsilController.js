// controllers/TehsilController.js

const tehsilService = require("../services/TehsilService");

// Add Tehsil
exports.addTehsil = async (req, res) => {
  try {
    const tehsil = await tehsilService.addTehsil(req.body);
    res.json(tehsil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Tehsil By ID
exports.getTehsilById = async (req, res) => {
  try {
    const tehsil = await tehsilService.getTehsilById(req.query.tehsilId);
    res.json(tehsil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Tehsil By Name
exports.getTehsilByName = async (req, res) => {
  try {
    const tehsil = await tehsilService.getTehsilByName(req.query.name);
    res.json(tehsil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Tehsil Info
exports.getTehsilInfo = async (req, res) => {
  try {
    const tehsil = await tehsilService.getTehsilById(req.query.tehsilId);
    res.json(tehsil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Tehsils
exports.getAllTehsils = async (req, res) => {
  try {
    const { pageIndex, pageSize, status, searchText, districtId } =
      req.query;

    const tehsils = await tehsilService.getAllTehsil(
      pageIndex,
      pageSize,
      status,
      searchText,
      districtId
    );

    res.json(tehsils);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Block/Unblock Tehsil
exports.blockUnblockTehsil = async (req, res) => {
  try {
    const { id, status } = req.body;

    const tehsil = await tehsilService.blockUnblockTehsil(
      id,
      status
    );

    res.json(tehsil);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};