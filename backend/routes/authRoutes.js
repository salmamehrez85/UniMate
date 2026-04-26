const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.put("/reset-password/:token", authController.resetPassword);

// Protected route (for future use)
// router.get('/me', protect, authController.getMe);

module.exports = router;
