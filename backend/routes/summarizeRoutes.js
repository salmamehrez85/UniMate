const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const { summarizeUploadedDocument } = require("../controller/courseController");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// Test endpoint to verify API key is working
router.get("/test-key", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY not found in environment",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const response = await model.generateContent(
      "Say 'API key works!' in exactly 5 words",
    );
    const text = response.response.text();

    return res.status(200).json({
      success: true,
      message: "API key is valid and working",
      testResponse: text,
    });
  } catch (error) {
    console.error("[API Key Test Error]", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString(),
    });
  }
});

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
        new Error("Unsupported file type. Allowed: PDF, JPEG, PNG, WEBP"),
      );
    }

    cb(null, true);
  },
});

router.post(
  "/upload",
  protect,
  upload.single("file"),
  summarizeUploadedDocument,
);

module.exports = router;
