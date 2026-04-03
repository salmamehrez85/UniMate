const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const { summarizeUploadedDocument } = require("../controller/courseController");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

// Simple hello-world debug endpoint
router.get("/hello", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const maskedKey = apiKey
    ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
    : "NOT SET";

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      usingKey: maskedKey,
      error: "GEMINI_API_KEY not found in environment",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: geminiModel });
    const result = await model.generateContent("Say hello world");
    const text = result.response.text();

    return res.status(200).json({
      success: true,
      usingKey: maskedKey,
      model: geminiModel,
      prompt: "Say hello world",
      geminiResponse: text,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      usingKey: maskedKey,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      error: error.message,
    });
  }
});

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
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });

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
