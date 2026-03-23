const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");
const { protect } = require("../middleware/auth");

// All routes are protected
router.use(protect);

router
  .route("/")
  .get(courseController.getCourses)
  .post(courseController.createCourse);

// Predicted GPA route (must come before /:id to avoid conflicts)
router.route("/predicted-gpa").get(courseController.getPredictedGPA);

// GPA Trend route
router.route("/gpa-trend").get(courseController.getGPATrend);

// AI Recommendations route (must come before /:id to avoid conflicts)
router.route("/recommendations").get(courseController.getAIRecommendations);

// Summarizer route
router.route("/summarize").post(courseController.summarizeCourseContent);

router.route("/:id/save-summary").post(courseController.saveSummaryToCourse);

router
  .route("/:id")
  .get(courseController.getCourse)
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

module.exports = router;
