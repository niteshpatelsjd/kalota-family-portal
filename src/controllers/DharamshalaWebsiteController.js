const websiteService = require("../services/DharamshalaWebsiteService");

exports.addUpdateWebsite = async (req, res) => {
  const result = await websiteService.addUpdateWebsite({
    ...req.body,
    bannerImageFile: req.files?.bannerImageFile?.[0] || null,
    logoImageFile: req.files?.logoImageFile?.[0] || null,
  });
  return res.status(result.responseCode).json(result);
};

exports.getWebsiteByDharamshalaId = async (req, res) => {
  const result = await websiteService.getWebsiteByDharamshalaId({ ...req.query, ...req.params });
  return res.status(result.responseCode).json(result);
};

exports.getPublicWebsiteBySlug = async (req, res) => {
  const result = await websiteService.getPublicWebsiteBySlug(req.params);
  return res.status(result.responseCode).json(result);
};

exports.blockUnblockWebsite = async (req, res) => {
  const result = await websiteService.blockUnblockWebsite(req.body);
  return res.status(result.responseCode).json(result);
};
