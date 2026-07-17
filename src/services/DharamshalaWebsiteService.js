const mongoose = require("mongoose");
const Dharamshala = require("../models/Dharamshala");
const DharamshalaWebsite = require("../models/DharamshalaWebsite");
const buildResponse = require("../utils/response");
const logger = require("../utils/logger");
const uploadToCloudinary = require("../utils/CloudnaryUploadUtil");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function createSlug(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

function toStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return toStringArray(parsed);
    } catch (_) {}
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toGallery(value) {
  if (!value) return [];
  let items = value;

  if (typeof value === "string") {
    try {
      items = JSON.parse(value);
    } catch (_) {
      items = [];
    }
  }

  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      type: ["IMAGE", "VIDEO"].includes(String(item.type || "IMAGE").toUpperCase())
        ? String(item.type || "IMAGE").toUpperCase()
        : "IMAGE",
      url: String(item.url || "").trim(),
      title: String(item.title || "").trim(),
    }))
    .filter((item) => item.url);
}

function mapWebsiteResponse(website) {
  if (!website) return null;

  const dharamshala = website.dharamshalaId;

  return {
    id: website._id,
    dharamshalaId: dharamshala?._id || website.dharamshalaId,
    dharamshalaResponse:
      dharamshala && dharamshala._id
        ? {
            id: dharamshala._id,
            name: dharamshala.name || "",
            type: dharamshala.type || "",
            description: dharamshala.description || "",
            address: dharamshala.address || "",
            mobileNumber: dharamshala.mobileNumber || "",
            alternateMobileNumber: dharamshala.alternateMobileNumber || "",
            email: dharamshala.email || "",
            website: dharamshala.website || "",
            profileImage: dharamshala.profileImage || "",
            bannerImage: dharamshala.bannerImage || "",
            latitude: dharamshala.latitude || null,
            longitude: dharamshala.longitude || null,
          }
        : null,
    slug: website.slug || "",
    domain: website.domain || "",
    heroTitle: website.heroTitle || "",
    heroSubtitle: website.heroSubtitle || "",
    aboutTitle: website.aboutTitle || "",
    aboutDescription: website.aboutDescription || "",
    bannerImage: website.bannerImage || "",
    logoImage: website.logoImage || "",
    contactNumber: website.contactNumber || "",
    alternateContactNumber: website.alternateContactNumber || "",
    contactEmail: website.contactEmail || "",
    website: website.website || "",
    address: website.address || "",
    latitude: website.latitude || null,
    longitude: website.longitude || null,
    bookingEnabled: website.bookingEnabled,
    donationEnabled: website.donationEnabled,
    facilities: website.facilities || [],
    rules: website.rules || [],
    gallery: website.gallery || [],
    seoTitle: website.seoTitle || "",
    seoDescription: website.seoDescription || "",
    status: website.status,
    createdAt: website.createdAt,
    updatedAt: website.updatedAt,
  };
}

function buildDefaultContent(dharamshala) {
  return {
    slug: createSlug(dharamshala.name || dharamshala._id),
    heroTitle: dharamshala.name || "",
    heroSubtitle:
      dharamshala.description ||
      "A community dharamshala for family functions, social events and public service.",
    aboutTitle: "About Dharamshala",
    aboutDescription: dharamshala.description || "",
    bannerImage: dharamshala.bannerImage || dharamshala.profileImage || "",
    logoImage: dharamshala.profileImage || dharamshala.bannerImage || "",
    contactNumber: dharamshala.mobileNumber || "",
    alternateContactNumber: dharamshala.alternateMobileNumber || "",
    contactEmail: dharamshala.email || "",
    website: dharamshala.website || "",
    address: dharamshala.address || "",
    latitude: dharamshala.latitude || null,
    longitude: dharamshala.longitude || null,
    bookingEnabled: true,
    donationEnabled: true,
    facilities: [
      "Clean rooms and hall space",
      "Drinking water facility",
      "Kitchen and dining support",
      "Community event support",
    ],
    rules: [
      "Booking confirmation depends on availability.",
      "Committee approval may be required for events.",
      "Keep the premises clean after use.",
    ],
    gallery: [],
    seoTitle: dharamshala.name || "Dharamshala",
    seoDescription: dharamshala.description || "",
  };
}

async function addUpdateWebsite(data) {
  try {
    const { dharamshalaId, id, createdBy, updatedBy } = data;

    if (!dharamshalaId || !isValidObjectId(dharamshalaId)) {
      return buildResponse(400, "Valid dharamshalaId is required", null);
    }

    const dharamshala = await Dharamshala.findById(dharamshalaId);
    if (!dharamshala) {
      return buildResponse(404, "Dharamshala not found", null);
    }

    const defaultContent = buildDefaultContent(dharamshala);
    const slug = createSlug(data.slug || data.heroTitle || defaultContent.slug);

    if (!slug) {
      return buildResponse(400, "Valid slug is required", null);
    }

    const duplicate = await DharamshalaWebsite.findOne({
      slug,
      ...(id ? { _id: { $ne: id } } : {}),
      dharamshalaId: { $ne: dharamshalaId },
    });

    if (duplicate) {
      return buildResponse(400, "Website slug already exists", null);
    }

    let uploadedBannerImage = data.bannerImage || defaultContent.bannerImage;
    let uploadedLogoImage = data.logoImage || defaultContent.logoImage;

    if (data.bannerImageFile) {
      try {
        const uploaded = await uploadToCloudinary(
          data.bannerImageFile.path,
          "kalota/dharamshala/websites/banners"
        );
        uploadedBannerImage = uploaded.url;
      } catch (err) {
        logger.error("Failed to upload website banner image", err);
      }
    }

    if (data.logoImageFile) {
      try {
        const uploaded = await uploadToCloudinary(
          data.logoImageFile.path,
          "kalota/dharamshala/websites/logos"
        );
        uploadedLogoImage = uploaded.url;
      } catch (err) {
        logger.error("Failed to upload website logo image", err);
      }
    }

    const payload = {
      dharamshalaId,
      slug,
      domain: data.domain || "",
      heroTitle: data.heroTitle || defaultContent.heroTitle,
      heroSubtitle: data.heroSubtitle || defaultContent.heroSubtitle,
      aboutTitle: data.aboutTitle || defaultContent.aboutTitle,
      aboutDescription: data.aboutDescription || defaultContent.aboutDescription,
      bannerImage: uploadedBannerImage,
      logoImage: uploadedLogoImage,
      contactNumber: data.contactNumber || defaultContent.contactNumber,
      alternateContactNumber:
        data.alternateContactNumber || defaultContent.alternateContactNumber,
      contactEmail: data.contactEmail || defaultContent.contactEmail,
      website: data.website || defaultContent.website,
      address: data.address || defaultContent.address,
      latitude: data.latitude !== undefined && data.latitude !== "" ? Number(data.latitude) : defaultContent.latitude,
      longitude: data.longitude !== undefined && data.longitude !== "" ? Number(data.longitude) : defaultContent.longitude,
      bookingEnabled: toBoolean(data.bookingEnabled, true),
      donationEnabled: toBoolean(data.donationEnabled, true),
      facilities: toStringArray(data.facilities).length ? toStringArray(data.facilities) : defaultContent.facilities,
      rules: toStringArray(data.rules).length ? toStringArray(data.rules) : defaultContent.rules,
      gallery: toGallery(data.gallery),
      seoTitle: data.seoTitle || defaultContent.seoTitle,
      seoDescription: data.seoDescription || defaultContent.seoDescription,
      status: data.status === undefined || data.status === "" ? 1 : Number(data.status),
      updatedBy: updatedBy || createdBy || null,
    };

    let website;

    if (id) {
      if (!isValidObjectId(id)) {
        return buildResponse(400, "Invalid id", null);
      }

      website = await DharamshalaWebsite.findByIdAndUpdate(id, payload, {
        new: true,
      }).populate("dharamshalaId");

      if (!website) {
        return buildResponse(404, "Dharamshala website not found", null);
      }
    } else {
      website = await DharamshalaWebsite.findOneAndUpdate(
        { dharamshalaId },
        { ...payload, createdBy: createdBy || null },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate("dharamshalaId");
    }

    return buildResponse(
      200,
      id ? "Website content updated successfully" : "Website content saved successfully",
      mapWebsiteResponse(website)
    );
  } catch (error) {
    logger.error("addUpdateWebsite error", {
      error: error.message,
      stack: error.stack,
      data,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function getWebsiteByDharamshalaId({ dharamshalaId }) {
  try {
    if (!dharamshalaId || !isValidObjectId(dharamshalaId)) {
      return buildResponse(400, "Valid dharamshalaId is required", null);
    }

    const website = await DharamshalaWebsite.findOne({ dharamshalaId }).populate(
      "dharamshalaId"
    );

    if (!website) {
      const dharamshala = await Dharamshala.findById(dharamshalaId);
      if (!dharamshala) return buildResponse(404, "Dharamshala not found", null);

      return buildResponse(200, "Default website content fetched successfully", {
        dharamshalaId: dharamshala._id,
        dharamshalaResponse: mapWebsiteResponse({
          dharamshalaId: dharamshala,
          ...buildDefaultContent(dharamshala),
          status: 1,
        })?.dharamshalaResponse,
        ...buildDefaultContent(dharamshala),
        status: 1,
      });
    }

    return buildResponse(
      200,
      "Website content fetched successfully",
      mapWebsiteResponse(website)
    );
  } catch (error) {
    logger.error("getWebsiteByDharamshalaId error", {
      error: error.message,
      stack: error.stack,
      dharamshalaId,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function getPublicWebsiteBySlug({ slug }) {
  try {
    const normalizedSlug = createSlug(slug);
    if (!normalizedSlug) {
      return buildResponse(400, "Valid slug is required", null);
    }

    const website = await DharamshalaWebsite.findOne({
      slug: normalizedSlug,
      status: 1,
    }).populate("dharamshalaId");

    if (!website) {
      return buildResponse(404, "Website content not found", null);
    }

    return buildResponse(
      200,
      "Website content fetched successfully",
      mapWebsiteResponse(website)
    );
  } catch (error) {
    logger.error("getPublicWebsiteBySlug error", {
      error: error.message,
      stack: error.stack,
      slug,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

async function blockUnblockWebsite({ id, status }) {
  try {
    if (!id || !isValidObjectId(id)) {
      return buildResponse(400, "Valid id is required", null);
    }

    const numericStatus = Number(status);
    if (![0, 1, 2].includes(numericStatus)) {
      return buildResponse(400, "status must be 0, 1 or 2", null);
    }

    const website = await DharamshalaWebsite.findByIdAndUpdate(
      id,
      { status: numericStatus },
      { new: true }
    ).populate("dharamshalaId");

    if (!website) {
      return buildResponse(404, "Website content not found", null);
    }

    const message =
      numericStatus === 0
        ? "Website content deleted successfully"
        : numericStatus === 1
          ? "Website content activated successfully"
          : "Website content blocked successfully";

    return buildResponse(200, message, mapWebsiteResponse(website));
  } catch (error) {
    logger.error("blockUnblockWebsite error", {
      error: error.message,
      stack: error.stack,
      id,
      status,
    });

    return buildResponse(500, "Internal Server Error", null);
  }
}

module.exports = {
  addUpdateWebsite,
  getWebsiteByDharamshalaId,
  getPublicWebsiteBySlug,
  blockUnblockWebsite,
};
