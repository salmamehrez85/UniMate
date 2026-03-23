const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const { summarizeUploadedDocument } = require("../controller/courseController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Unsupported file type. Allowed: PDF, JPEG, PNG, WEBP",
        ),
      );
    }

    cb(null, true);
  },
});

router.post("/upload", protect, upload.single("file"), summarizeUploadedDocument);

module.exports = router;
