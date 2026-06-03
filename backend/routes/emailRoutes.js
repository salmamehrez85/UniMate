const express = require("express");
const { protect } = require("../middleware/auth");
const { formalizeEmail } = require("../controller/emailController");

const router = express.Router();

// POST /api/email/formalize - Formalize email using Gemini AI
router.post("/formalize", protect, formalizeEmail);

module.exports = router;
