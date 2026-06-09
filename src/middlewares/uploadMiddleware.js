const multer = require("multer");
const path = require("path");

/*
 * Storage
 */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName +
        path.extname(file.originalname)
    );
  },
});

/*
 * File Filter
 */

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes =
    /jpeg|jpg|png|webp/;

  const extname =
    allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

  const mimetype =
    allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(
    new Error(
      "Only image files are allowed"
    )
  );
};

/*
 * Upload Config
 */

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;