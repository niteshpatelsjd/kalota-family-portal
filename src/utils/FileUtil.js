const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const logger = require("./logger");

const uploadPath = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  logger.info(`📂 Created uploads directory at: ${uploadPath}`);
}

/**
 * Save a multer file to local filesystem and return its public URL
 */
async function uploadFile(file, folder = "general") {
  try {
    if (!file) {
      logger.warn("⚠️ No file provided to uploadFile()");
      return null;
    }

    const ext = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${ext}`;
    const destDir = path.join(uploadPath, folder);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const destPath = path.join(destDir, fileName);

    if (file.buffer) {
      fs.writeFileSync(destPath, file.buffer);
    } else if (file.path) {
      fs.renameSync(file.path, destPath);
    }

    const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    const fileUrl = `${base}/uploads/${folder}/${fileName}`;

    logger.info(`✅ File saved locally: ${file.originalname} → ${fileUrl}`);
    return fileUrl;
  } catch (err) {
    logger.error("❌ uploadFile error", { error: err });
    throw err;
  }
}

module.exports = { uploadFile };
