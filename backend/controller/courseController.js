const Course = require("../model/Course");
const {
  calculateAIPrediction,
  generateActionableRecommendations,
} = require("../services/aiPredictor");

// Helper function to auto-assign semester based on current month
const getCurrentSemester = () => {
  const month = new Date().getMonth(); // 0-11
  const year = new Date().getFullYear();

  // Winter: January (0) - February (1)
  if (month >= 0 && month <= 2) {
    return `Winter ${year}`;
  }
  // Spring: March (2) - May (4)
  else if (month >= 3 && month <= 6) {
    return `Spring ${year}`;
  }
  // Summer: June (5) - August (7)
  else if (month >= 7 && month <= 9) {
    return `Summer ${year}`;
  }
  // Fall: 10 - 11
  else {
    return `Fall ${year}`;
  }
};

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
      semester: semester || getCurrentSemester(), // Auto-assign semester if not provided
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

// Helper function to calculate confidence based on prediction quality
const calculateConfidenceFromPrediction = (
  currentAverage,
  predictedMin,
  predictedMax,
) => {
  if (
    currentAverage === null ||
    currentAverage === undefined ||
    currentAverage === 0
  ) {
    return "Medium"; // New courses get medium confidence
  }

  const range = predictedMax - predictedMin;
  const avgPredicted = (predictedMin + predictedMax) / 2;

  // Tight range (≤6%) and good alignment with current = High confidence
  if (range <= 6 && Math.abs(avgPredicted - currentAverage) <= 5) {
    return "High";
  }
  // Medium range (7-12%) or moderate alignment = Medium confidence
  if (range <= 12 || Math.abs(avgPredicted - currentAverage) <= 10) {
    return "Medium";
  }
  // Wide range (>12%) or poor alignment = Low confidence
  return "Low";
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
  // Handle courses with no assessment data yet
  if (currentAverage === null || currentAverage === undefined) {
    return {
      min: 60,
      max: 75,
      confidence: "Low",
      reason:
        "No assessment data yet - prediction based on general patterns. Actual range depends on upcoming work.",
    };
  }

  // Handle 0% grade (course just started)
  if (currentAverage === 0) {
    return {
      min: 50,
      max: 65,
      confidence: "Low",
      reason:
        "No assessment data yet - recovery requires significant effort. Assumes ~40% coursework remaining at 100% performance.",
    };
  }

  let min, max, confidence, reason;

  if (currentAverage >= 90) {
    min = Math.max(currentAverage - 3, 87);
    max = Math.min(currentAverage + 2, 100);
    confidence = "High";
    reason = "Excellent performance - maintaining high standards";
  } else if (currentAverage >= 85) {
    min = Math.max(currentAverage - 4, 81);
    max = Math.min(currentAverage + 3, 95);
    confidence = "High";
    reason = "Strong performance - on track for excellent grade";
  } else if (currentAverage >= 80) {
    min = Math.max(currentAverage - 5, 75);
    max = Math.min(currentAverage + 4, 92);
    confidence = "High";
    reason = "Good performance - steady progress";
  } else if (currentAverage >= 75) {
    min = Math.max(currentAverage - 8, 70);
    max = Math.min(currentAverage + 5, 90);
    confidence = "Medium";
    reason = "Solid performance - room for improvement";
  } else if (currentAverage >= 65) {
    min = Math.max(currentAverage - 10, 60);
    max = Math.min(currentAverage + 8, 85);
    confidence = "Medium";
    reason = "Passing but needs focus - increase effort";
  } else {
    min = Math.max(currentAverage - 10, 50);
    max = Math.min(currentAverage + 15, 75);
    confidence = "Medium";
    reason = "Below expectation - immediate action needed";
  }

  return {
    min: Math.round(min),
    max: Math.round(max),
    confidence,
    reason,
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
          const predictionMin = Math.max(Math.round(predictedScore - 3), 0);
          const predictionMax = Math.min(Math.round(predictedScore + 3), 100);

          prediction = {
            min: predictionMin,
            max: predictionMax,
            confidence: aiResult.confidence,
            similarCourses: aiResult.similar_courses || [],
            usedAI: !aiResult.error,
          };
        } catch (error) {
          console.error("AI prediction failed for course:", course.code, error);
          // Fall back to rule-based prediction
          prediction = predictFinalGradeFallback(currentPerformance);
          prediction.usedAI = false;

          // Recalculate confidence based on fallback prediction quality
          const qualityConfidence = calculateConfidenceFromPrediction(
            currentPerformance,
            prediction.min,
            prediction.max,
          );
          prediction.confidence = qualityConfidence;
        }
      } else {
        // Not enough data for AI, use fallback
        prediction = predictFinalGradeFallback(currentPerformance);
        prediction.usedAI = false;

        // Apply quality-based confidence calculation
        const qualityConfidence = calculateConfidenceFromPrediction(
          currentPerformance,
          prediction.min,
          prediction.max,
        );
        prediction.confidence = qualityConfidence;
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

// @desc    Get GPA trend by semester
// @route   GET /api/courses/gpa-trend
// @access  Private
exports.getGPATrend = async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user._id }).sort({
      createdAt: 1,
    });

    // Separate completed and active courses
    const completedCourses = courses.filter((c) => c.isOldCourse === true);
    const activeCourses = courses.filter((c) => c.isOldCourse !== true);

    // Group completed courses by semester
    const coursesBySemester = {};

    completedCourses.forEach((course) => {
      // Use finalGrade if available, otherwise calculate from final assessment
      let gradePercentage = course.finalGrade;

      if (!gradePercentage) {
        const finalAssessment = (course.assessments || []).find(
          (a) => a.type === "final",
        );
        if (finalAssessment) {
          gradePercentage =
            (finalAssessment.score / finalAssessment.maxScore) * 100;
        }
      }

      const semesterKey =
        course.semester ||
        (course.createdAt
          ? (() => {
              const month = course.createdAt.getMonth();
              const year = course.createdAt.getFullYear();
              if (month >= 7) return `Fall ${year}`;
              else if (month >= 0 && month <= 3) return `Spring ${year}`;
              else return `Summer ${year}`;
            })()
          : "Unknown");

      if (!coursesBySemester[semesterKey]) {
        coursesBySemester[semesterKey] = {
          semester: semesterKey,
          courses: [],
          totalGradePoints: 0,
          totalCredits: 0,
        };
      }

      const credits = parseFloat(course.credits) || 3;
      const gpaPoints = gradeToGPA(gradePercentage);

      coursesBySemester[semesterKey].courses.push({
        code: course.code,
        name: course.name,
        grade: Math.round(gradePercentage),
        gpaPoints,
        credits,
      });

      coursesBySemester[semesterKey].totalGradePoints += gpaPoints * credits;
      coursesBySemester[semesterKey].totalCredits += credits;
    });

    // Convert completed courses to trend array with isPredicted flag
    const gpaTrendData = Object.values(coursesBySemester).map(
      (semesterData) => ({
        semester: semesterData.semester,
        gpa:
          semesterData.totalCredits > 0
            ? Math.round(
                (semesterData.totalGradePoints / semesterData.totalCredits) *
                  100,
              ) / 100
            : 0,
        isPredicted: false,
      }),
    );

    // Get predicted GPA for active courses using internal function call
    let predictedDataPoint = null;

    if (activeCourses.length > 0) {
      try {
        // Create a mock response object to internally call getPredictedGPA
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              mockRes.jsonData = data;
              mockRes.jsonCode = code;
              return mockRes;
            },
          }),
          jsonData: null,
          jsonCode: null,
        };

        // Call getPredictedGPA internally
        await exports.getPredictedGPA(req, mockRes);

        // Extract the result from mock response
        if (
          mockRes.jsonCode === 200 &&
          mockRes.jsonData &&
          mockRes.jsonData.success
        ) {
          const predictedResult = mockRes.jsonData;

          // Use current semester for prediction (not stored semester from past creation date)
          const activeSemesterName = getCurrentSemester();

          // Use conservative prediction (min value)
          const predictedGPA = predictedResult.predictedGPA.min;

          // Add predicted data point to trend array with "(Projected)" suffix to avoid x-axis duplication
          predictedDataPoint = {
            semester: `${activeSemesterName} (Projected)`,
            gpa: predictedGPA,
            isPredicted: true,
          };

          gpaTrendData.push(predictedDataPoint);
        }
      } catch (error) {
        console.error("Error fetching predicted GPA for trend:", error);
        // Continue without predicted data if there's an error
      }
    }

    // Sort the combined array chronologically
    gpaTrendData.sort((a, b) => {
      const semesterOrder = { winter: 0, spring: 1, summer: 2, fall: 3 };
      const aYear = parseInt(a.semester.match(/\d{4}/)?.[0] || 0);
      const bYear = parseInt(b.semester.match(/\d{4}/)?.[0] || 0);
      const aSeason =
        semesterOrder[a.semester.toLowerCase().split(" ")[0]] || 0;
      const bSeason =
        semesterOrder[b.semester.toLowerCase().split(" ")[0]] || 0;

      if (aYear !== bYear) return aYear - bYear;
      return aSeason - bSeason;
    });

    // Calculate overall GPA (from completed courses only)
    let totalGradePoints = 0;
    let totalCredits = 0;

    Object.values(coursesBySemester).forEach((semesterData) => {
      totalGradePoints += semesterData.totalGradePoints;
      totalCredits += semesterData.totalCredits;
    });

    const overallGPA =
      totalCredits > 0
        ? Math.round((totalGradePoints / totalCredits) * 100) / 100
        : 0;

    res.status(200).json({
      success: true,
      overallGPA,
      totalCredits,
      gpaTrend: gpaTrendData,
      totalSemesters: gpaTrendData.length,
      hasActiveCoursePrediction: predictedDataPoint !== null,
    });
  } catch (error) {
    console.error("GPA trend error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching GPA trend",
    });
  }
};

// @desc    Get AI recommendations for active courses
// @route   GET /api/courses/recommendations
// @access  Private
exports.getAIRecommendations = async (req, res) => {
  try {
    console.log(
      "📋 AI Recommendations endpoint called for user:",
      req.user._id,
    );

    const courses = await Course.find({ userId: req.user._id });
    console.log(`📚 Total courses found: ${courses.length}`);

    if (courses.length > 0) {
      console.log(
        "Courses:",
        courses.map((c) => ({
          code: c.code,
          name: c.name,
          isOldCourse: c.isOldCourse,
          hasAssessments: c.assessments && c.assessments.length > 0,
          assessmentCount: c.assessments ? c.assessments.length : 0,
        })),
      );
    }

    // Filter for active courses only
    const activeCourses = courses.filter((c) => c.isOldCourse !== true);
    console.log(`✅ Active courses found: ${activeCourses.length}`);

    if (activeCourses.length === 0) {
      console.log("⚠️  No active courses to generate recommendations");
      return res.status(200).json({
        success: true,
        data: [],
        debug: {
          totalCourses: courses.length,
          activeCourses: 0,
          message: "No active courses found",
        },
      });
    }

    // Map active courses with calculated current performance and tasks
    const mappedActiveCourses = activeCourses.map((course) => {
      const currentPerf = calculateCurrentPerformance(course.assessments || []);
      console.log(
        `  📖 ${course.code}: currentPerformance=${currentPerf}, tasks=${(course.tasks || []).length}, assessments=${(course.assessments || []).length}`,
      );

      return {
        code: course.code,
        name: course.name,
        currentPerformance: currentPerf,
        tasks: course.tasks || [],
        assessments: course.assessments || [],
        phases: course.phases || [],
      };
    });

    console.log(
      "📊 Mapped active courses for AI:",
      JSON.stringify(mappedActiveCourses, null, 2),
    );

    // Call AI to generate recommendations
    console.log("🤖 Calling generateActionableRecommendations...");
    const aiResult =
      await generateActionableRecommendations(mappedActiveCourses);

    console.log("🤖 AI Result returned:", aiResult);
    console.log(
      "🤖 Recommendations count:",
      aiResult.recommendations ? aiResult.recommendations.length : 0,
    );

    res.status(200).json({
      success: true,
      data: aiResult.recommendations || [],
      debug: {
        activeCourses: activeCourses.length,
        recommendationsReturned: aiResult.recommendations
          ? aiResult.recommendations.length
          : 0,
      },
    });
  } catch (error) {
    console.error("❌ AI recommendations error:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error generating recommendations",
      error: error.message,
    });
  }
};
