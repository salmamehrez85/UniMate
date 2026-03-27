const express = require("express");
const { protect } = require("../middleware/auth");
const {
  generateQuiz,
  submitQuiz,
  getAvailable,
} = require("../controller/quizController");

const router = express.Router();

router.use(protect);

router.post("/generate", generateQuiz);
router.post("/submit", submitQuiz);
router.get("/available/:courseId", getAvailable);

module.exports = router;
