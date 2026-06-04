const familyService = require("../services/FamilyService");

exports.createFamily = async (req, res) => {
  const result = await familyService.createFamily(req.body);
  res.status(200).json(result);
};

exports.addProfile = async (req, res) => {
  const result = await familyService.addProfile(req.body);
  res.status(200).json(result);
};

exports.updateProfile = async (req, res) => {
  const result = await familyService.updateProfile(req.params.id, req.body);
  res.status(200).json(result);
};

exports.getFamilyDetails = async (req, res) => {
  const result = await familyService.getFamilyDetails(req.params.familyId);
  res.status(200).json(result);
};

exports.getAllFamilies = async (req, res) => {
  const { pageIndex = 0, pageSize = 10, searchText, district, tehsil, village } = req.query;
  const result = await familyService.getAllFamilies({
    pageIndex: parseInt(pageIndex, 10),
    pageSize: parseInt(pageSize, 10),
    searchText,
    district,
    tehsil,
    village,
  });
  res.status(200).json(result);
};

exports.searchFamiliesForRegistration = async (req, res) => {
  const result = await familyService.searchFamiliesForRegistration(req.query);
  res.status(200).json(result);
};

exports.blockUnblockFamily = async (req, res) => {
  const { familyId, status } = req.body;
  const result = await familyService.blockUnblockFamily(familyId, status);
  res.status(200).json(result);
};
