const locationService = require("../services/LocationService");

exports.addLocation = async (req, res) => {
  const result = await locationService.addLocation(req.body);
  res.status(200).json(result);
};

exports.getLocationById = async (req, res) => {
  const result = await locationService.getLocationById(req.params.id);
  res.status(200).json(result);
};

exports.getAllLocations = async (req, res) => {
  const { pageIndex = 0, pageSize = 10, searchText, district, tehsil } = req.query;
  const result = await locationService.getAllLocations({
    pageIndex: parseInt(pageIndex, 10),
    pageSize: parseInt(pageSize, 10),
    searchText,
    district,
    tehsil,
  });
  res.status(200).json(result);
};

exports.blockUnblock = async (req, res) => {
  const { id, status } = req.body;
  const result = await locationService.blockUnblock(id, status);
  res.status(200).json(result);
};

exports.getDistricts = async (req, res) => {
  const result = await locationService.getDistricts();
  res.status(200).json(result);
};

exports.getTehsilsByDistrict = async (req, res) => {
  const result = await locationService.getTehsilsByDistrict(req.query.district);
  res.status(200).json(result);
};

exports.getVillagesByTehsil = async (req, res) => {
  const result = await locationService.getVillagesByTehsil(req.query.district, req.query.tehsil);
  res.status(200).json(result);
};
