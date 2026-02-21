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

router
  .route("/:id")
  .get(courseController.getCourse)
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

module.exports = router;
