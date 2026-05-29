const express = require("express");
const { protect } = require("../middleware/auth");
const {
  generateQuiz,
  submitQuiz,
  getAvailable,
  getResultsByCourse,
  deleteQuiz,
  deleteQuizResult,
} = require("../controller/quizController");

const router = express.Router();

router.use(protect);

router.post("/generate", generateQuiz);
router.post("/submit", submitQuiz);
router.get("/results/:courseId", getResultsByCourse);
router.delete("/results/:resultId", deleteQuizResult);
router.get("/available/:courseId", getAvailable);
router.delete("/:quizId", deleteQuiz);

module.exports = router;
