// controllers/VillageController.js

const villageService = require("../services/VillageService");

// Add Village
exports.addVillage = async (req, res) => {
  try {
    const village = await villageService.addVillage(req.body);
    res.json(village);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Village By ID
exports.getVillageById = async (req, res) => {
  try {
    const village = await villageService.getVillageById(req.query.villageId);
    res.json(village);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Village By Name
exports.getVillageByName = async (req, res) => {
  try {
    const village = await villageService.getVillageByName(req.query.name);
    res.json(village);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Village Info
exports.getVillageInfo = async (req, res) => {
  try {
    const village = await villageService.getVillageById(req.query.villageId);
    res.json(village);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Villages
exports.getAllVillages = async (req, res) => {
  try {
    const {
      pageIndex,
      pageSize,
      status,
      searchText,
      districtId,
      tehsilId,
    } = req.query;

    const villages = await villageService.getAllVillage(
      pageIndex,
      pageSize,
      status,
      searchText,
      districtId,
      tehsilId
    );

    res.json(villages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Block / Unblock Village
exports.blockUnblockVillage = async (req, res) => {
  try {
    const { id, status } = req.body;

    const village = await villageService.blockUnblockVillage(
      id,
      status
    );

    res.json(village);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};