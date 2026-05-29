const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const courseController = require("../controller/courseController");
const { protect } = require("../middleware/auth");

// ── Multer config for lecture uploads ───────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../uploads/lectures");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const lectureStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${require("crypto").randomUUID()}${ext}`);
  },
});

const lectureUpload = multer({
  storage: lectureStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF and image files are allowed."));
  },
});

// All routes are protected
router.use(protect);

router
  .route("/")
  .get(courseController.getCourses)
  .post(courseController.createCourse);

// Predicted GPA route (must come before /:id to avoid conflicts)
router.route("/predicted-gpa").get(courseController.getPredictedGPA);
router
  .route("/predicted-gpa/refresh")
  .post(courseController.refreshPredictedGPA);

// GPA Trend route
router.route("/gpa-trend").get(courseController.getGPATrend);

// AI Recommendations route (must come before /:id to avoid conflicts)
router.route("/recommendations").get(courseController.getAIRecommendations);
router
  .route("/recommendations/refresh")
  .post(courseController.refreshAIRecommendations);

// Summarizer route
router.route("/summarize").post(courseController.summarizeCourseContent);

router.route("/:id/save-summary").post(courseController.saveSummaryToCourse);

router
  .route("/:id")
  .get(courseController.getCourse)
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

router.route("/:id/predict").post(courseController.predictSingleCourse);

// Lecture upload / delete routes
router
  .route("/:id/lectures")
  .post(lectureUpload.single("file"), courseController.uploadLecture);
router.route("/:id/lectures/:lectureId").delete(courseController.deleteLecture);

module.exports = router;
