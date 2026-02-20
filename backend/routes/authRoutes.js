const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected route (for future use)
// router.get('/me', protect, authController.getMe);

module.exports = router;
