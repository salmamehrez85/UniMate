const Course = require("../model/Course");
const { calculateAIPrediction } = require("../services/aiPredictor");

// @desc    Get all courses for logged in user
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching courses",
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching course",
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private
exports.createCourse = async (req, res) => {
  try {
    const { code, name, instructor, schedule, credits, semester, outlineText } =
      req.body;

    // Add userId to course data
    const courseData = {
      userId: req.user._id,
      code,
      name,
      instructor: instructor || "",
      schedule: schedule || "",
      credits: credits || "",
      semester: semester || "",
      outlineText: outlineText || "",
      assessments: [],
      tasks: [],
      phases: [],
    };

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating course",
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: false,
    });

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating course",
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting course",
    });
  }
};

// Helper function to convert grade percentage to GPA points
const gradeToGPA = (percentage) => {
  if (percentage >= 90) return 4.0;
  if (percentage >= 85) return 3.7;
  if (percentage >= 80) return 3.3;
  if (percentage >= 75) return 3.0;
  if (percentage >= 70) return 2.7;
  if (percentage >= 65) return 2.3;
  if (percentage >= 60) return 2.0;
  return 0.0;
};

// Helper function to calculate current performance from assessments (weighted average)
const calculateCurrentPerformance = (assessments) => {
  // Filter out final exams, only consider quizzes, assignments, midterms
  const currentAssessments = assessments.filter(
    (a) => a.type !== "final" && a.score != null && a.maxScore != null,
  );

  if (currentAssessments.length === 0) return null;

  // Check if assessments have weights
  const hasWeights = currentAssessments.some(
    (a) => a.weight != null && a.weight > 0,
  );

  if (hasWeights) {
    // Calculate weighted average
    let weightedSum = 0;
    let totalWeight = 0;

    currentAssessments.forEach((assessment) => {
      const percentage = (assessment.score / assessment.maxScore) * 100;
      const weight = assessment.weight || 0;

      weightedSum += percentage * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : null;
  } else {
    // Fall back to simple average if no weights are provided
    let totalPercentage = 0;
    currentAssessments.forEach((assessment) => {
      const percentage = (assessment.score / assessment.maxScore) * 100;
      totalPercentage += percentage;
    });

    return totalPercentage / currentAssessments.length;
  }
};

// Helper function to predict final grade (fallback if AI fails)
const predictFinalGradeFallback = (currentAverage) => {
  if (currentAverage == null) {
    return { min: 65, max: 75, confidence: "Low" };
  }

  let min, max, confidence;

  if (currentAverage >= 85) {
    min = Math.max(currentAverage - 5, 80);
    max = Math.min(currentAverage + 5, 100);
    confidence = "High";
  } else if (currentAverage >= 75) {
    min = Math.max(currentAverage - 8, 70);
    max = Math.min(currentAverage + 5, 95);
    confidence = "High";
  } else if (currentAverage >= 65) {
    min = Math.max(currentAverage - 10, 60);
    max = Math.min(currentAverage + 5, 85);
    confidence = "Medium";
  } else {
    min = Math.max(currentAverage - 10, 50);
    max = Math.min(currentAverage + 10, 75);
    confidence = "Low";
  }

  return {
    min: Math.round(min),
    max: Math.round(max),
    confidence,
  };
};

// @desc    Calculate predicted GPA
// @route   GET /api/courses/predicted-gpa
// @access  Private
exports.getPredictedGPA = async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user._id });

    // Separate completed and active courses
    const completedCourses = courses.filter((c) => c.isOldCourse === true);
    const activeCourses = courses.filter((c) => c.isOldCourse !== true);

    // Calculate GPA from completed courses
    let completedWeightedGrade = 0;
    let completedCredits = 0;

    // Prepare past courses data for AI prediction
    const pastCoursesForAI = [];

    completedCourses.forEach((course) => {
      const finalAssessment = (course.assessments || []).find(
        (a) => a.type === "final",
      );

      if (finalAssessment) {
        const credits = parseFloat(course.credits) || 3;
        const finalGradePercentage =
          (finalAssessment.score / finalAssessment.maxScore) * 100;
        const gradePoints = gradeToGPA(finalGradePercentage);

        completedWeightedGrade += gradePoints * credits;
        completedCredits += credits;

        // Calculate the performance before final (for AI)
        const currentPerformance = calculateCurrentPerformance(
          course.assessments || [],
        );

        // Add to past courses dataset for AI
        pastCoursesForAI.push({
          code: course.code,
          name: course.name,
          outline: course.outlineText || course.name, // Use actual outline, fallback to name if not provided
          currentPerformance: currentPerformance || finalGradePercentage, // Fallback to final if no pre-final assessments
          finalGrade: finalGradePercentage,
        });
      }
    });

    // Process active courses and predict their final grades using AI
    const activeCoursePredictions = [];

    for (const course of activeCourses) {
      const currentPerformance = calculateCurrentPerformance(
        course.assessments || [],
      );
      const credits = parseFloat(course.credits) || 3;

      let prediction;

      // Only call AI if we have past courses data and current performance
      if (pastCoursesForAI.length > 0 && currentPerformance != null) {
        try {
          // Call Gemini AI predictor
          const aiResult = await calculateAIPrediction(
            {
              code: course.code,
              name: course.name,
              outline_text: course.outlineText || course.name,
              current_performance: currentPerformance,
            },
            pastCoursesForAI.map((c) => ({
              code: c.code,
              name: c.name,
              outline_text: c.outline, // Already has proper fallback from pastCoursesForAI setup
              current_performance: c.currentPerformance,
              final_grade: c.finalGrade,
            })),
          );

          // Convert AI prediction to min/max range (±3% confidence range)
          const predictedScore = aiResult.predicted_score_pct;
          prediction = {
            min: Math.max(Math.round(predictedScore - 3), 0),
            max: Math.min(Math.round(predictedScore + 3), 100),
            confidence: aiResult.confidence,
            similarCourses: aiResult.similar_courses || [],
            usedAI: !aiResult.error,
          };
        } catch (error) {
          console.error("AI prediction failed for course:", course.code, error);
          // Fall back to rule-based prediction
          prediction = predictFinalGradeFallback(currentPerformance);
          prediction.usedAI = false;
        }
      } else {
        // Not enough data for AI, use fallback
        prediction = predictFinalGradeFallback(currentPerformance);
        prediction.usedAI = false;
      }

      activeCoursePredictions.push({
        courseId: course._id,
        courseName: course.name,
        courseCode: course.code,
        currentPerformance,
        prediction,
        credits,
      });
    }

    // Calculate predicted GPA (minimum scenario)
    let minWeightedGrade = completedWeightedGrade;
    let minTotalCredits = completedCredits;

    activeCoursePredictions.forEach((pred) => {
      const minGradePoints = gradeToGPA(pred.prediction.min);
      minWeightedGrade += minGradePoints * pred.credits;
      minTotalCredits += pred.credits;
    });

    // Calculate predicted GPA (maximum scenario)
    let maxWeightedGrade = completedWeightedGrade;
    let maxTotalCredits = completedCredits;

    activeCoursePredictions.forEach((pred) => {
      const maxGradePoints = gradeToGPA(pred.prediction.max);
      maxWeightedGrade += maxGradePoints * pred.credits;
      maxTotalCredits += pred.credits;
    });

    const minGPA = minTotalCredits > 0 ? minWeightedGrade / minTotalCredits : 0;
    const maxGPA = maxTotalCredits > 0 ? maxWeightedGrade / maxTotalCredits : 0;

    // Calculate current GPA (completed courses only)
    const currentGPA =
      completedCredits > 0 ? completedWeightedGrade / completedCredits : 0;

    res.status(200).json({
      success: true,
      currentGPA: Math.round(currentGPA * 100) / 100,
      predictedGPA: {
        min: Math.round(minGPA * 100) / 100,
        max: Math.round(maxGPA * 100) / 100,
      },
      breakdown: {
        completedCourses: completedCourses.length,
        activeCourses: activeCourses.length,
        totalCredits: minTotalCredits,
      },
      activeCoursePredictions,
    });
  } catch (error) {
    console.error("Predicted GPA error:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating predicted GPA",
    });
  }
};
