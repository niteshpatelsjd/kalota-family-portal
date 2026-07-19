const fs = require("fs");

const cloudinary =
  require("../config/CloudnaryConfig");

async function uploadToCloudinary(
  filePath,
  folder = "general"
) {
  try {
    const result =
      await cloudinary.uploader.upload(
        filePath,
        {
          folder,
          resource_type: "auto",
        }
      );

    fs.unlinkSync(filePath);

    return {
      publicId:
        result.public_id,

      url:
        result.secure_url,
      resourceType:
        result.resource_type,
      format:
        result.format,
      width:
        result.width || null,
      height:
        result.height || null,
      duration:
        result.duration || null,
    };
  } catch (error) {
    throw error;
  }
}

module.exports =
  uploadToCloudinary;
