const Course = require("../model/Course");
const User = require("../model/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  calculateAIPrediction,
  generateActionableRecommendations,
  generateStructuredSummary,
} = require("../services/aiPredictor");

const UploadSummarySchema = {
  type: "object",
  properties: {
    overview: {
      type: "string",
      description: "Short high-value overview of the document content",
    },
    keyTopics: {
      type: "array",
      items: { type: "string" },
      description: "Main topics extracted from the document",
    },
    importantDefinitions: {
      type: "array",
      items: { type: "string" },
      description: "Key terms and concise definitions",
    },
    studyPlan: {
      type: "array",
      items: { type: "string" },
      description: "Actionable study sequence",
    },
    possibleQuestions: {
      type: "array",
      items: { type: "string" },
      description: "Likely test or quiz questions",
    },
  },
  required: [
    "overview",
    "keyTopics",
    "importantDefinitions",
    "studyPlan",
    "possibleQuestions",
  ],
};

const callGeminiUploadSummary = async (parts) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error(
      "Missing GEMINI_API_KEY - Please set GEMINI_API_KEY in .env file",
    );
    error.code = "MISSING_API_KEY";
    throw error;
  }

  // Validate API key format
  if (!apiKey.startsWith("AIza")) {
    const error = new Error(
      "Invalid GEMINI_API_KEY format - Key should start with 'AIza'",
    );
    error.code = "INVALID_API_KEY_FORMAT";
    throw error;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidateModels = [process.env.GEMINI_MODEL, "gemini-2.5-flash"].filter(
    Boolean,
  );

  let lastError;

  for (const modelId of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });

      const response = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: UploadSummarySchema,
          temperature: 0.1,
        },
      });

      const text = response.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error(`[${modelId}] Error:`, error.message);
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to call Gemini model");
};

const normalizeImageData = (imageData) => {
  // Already a normalized { mimeType, data } object (sent by handwritten notes path)
  if (
    imageData &&
    typeof imageData === "object" &&
    typeof imageData.mimeType === "string" &&
    typeof imageData.data === "string"
  ) {
    return { mimeType: imageData.mimeType, data: imageData.data };
  }

  if (!imageData || typeof imageData !== "string") return null;

  const trimmed = imageData.trim();

  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return null;
    return {
      mimeType: match[1],
      data: match[2],
    };
  }

  return {
    mimeType: "image/jpeg",
    data: trimmed,
  };
};

const parseSummaryOptionsFromBody = (body = {}) => {
  const allowedLanguages = ["en", "ar"];
  const allowedLengths = ["short", "medium", "long"];
  const allowedFocuses = ["general", "exam", "action", "detailed", "quick"];

  let options = {};

  if (body.options && typeof body.options === "object") {
    options = body.options;
  } else if (typeof body.options === "string") {
    try {
      const parsed = JSON.parse(body.options);
      if (parsed && typeof parsed === "object") {
        options = parsed;
      }
    } catch {
      options = {};
    }
  }

  const language = String(options.language || body.language || "en")
    .trim()
    .toLowerCase();
  const length = String(options.length || body.length || "medium")
    .trim()
    .toLowerCase();
  const focus = String(options.focus || body.focus || "general")
    .trim()
    .toLowerCase();

  return {
    language: allowedLanguages.includes(language) ? language : "en",
    length: allowedLengths.includes(length) ? length : "medium",
    focus: allowedFocuses.includes(focus) ? focus : "general",
  };
};

const buildUploadOptionPrompt = (mode, options) => {
  const lines = [];
  const modeLengthDefaults = {
    quick: "short",
    detailed: "long",
    exam: "medium",
    action: "short",
  };

  if (options.language === "ar") {
    lines.push(
      "- Language: All response text must be in Arabic (العربية). Do not output English sentences.",
    );
  } else {
    lines.push("- Language: All response text must be in English.");
  }

  if (options.length !== modeLengthDefaults[mode]) {
    if (options.length === "short") {
      lines.push("- Length: short and compact.");
    } else if (options.length === "long") {
      lines.push("- Length: long with extra depth.");
    } else {
      lines.push("- Length: medium balanced detail.");
    }
  }

  if (options.focus && options.focus !== "general" && options.focus !== mode) {
    lines.push(`- Additional focus: ${options.focus}.`);
  }

  return lines.join("\n");
};

// Helper function to auto-assign semester based on current month
const getCurrentSemester = () => {
  const month = new Date().getMonth(); // 0-11
  const year = new Date().getFullYear();

  // Winter: December (11) - February (1)
  if (month === 11 || month === 0 || month === 1) {
    return `Winter ${year}`;
  }
  // Spring: March (2) - May (4)
  if (month >= 2 && month <= 4) {
    return `Spring ${year}`;
  }
  // Summer: June (5) - August (7)
  if (month >= 5 && month <= 7) {
    return `Summer ${year}`;
  }
  // Fall: September (8) - November (10)
  return `Fall ${year}`;
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
    const {
      code,
      name,
      instructor,
      schedule,
      location,
      credits,
      semester,
      outlineText,
    } = req.body;

    // Add userId to course data
    const courseData = {
      userId: req.user._id,
      code,
      name,
      instructor: instructor || "",
      schedule: schedule || "",
      location: location || "",
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

// @desc    Save a generated summary to a course
// @route   POST /api/courses/:id/save-summary
// @access  Private
exports.saveSummaryToCourse = async (req, res) => {
  try {
    const { mode, text } = req.body;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Summary text is required" });
    }

    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    course.savedSummaries.push({ mode: mode || "quick", text: text.trim() });
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Summary saved to course",
      summaryCount: course.savedSummaries.length,
    });
  } catch (error) {
    console.error("Save summary error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error saving summary" });
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

// Shared helper — builds GPA result using per-course saved aiPrediction (no Gemini calls)
const computePredictedGPA = async (userId) => {
  const courses = await Course.find({ userId });

  const completedCourses = courses.filter((c) => c.isOldCourse === true);
  const activeCourses = courses.filter((c) => c.isOldCourse !== true);

  let completedWeightedGrade = 0;
  let completedCredits = 0;

  completedCourses.forEach((course) => {
    const finalAssessment = (course.assessments || []).find(
      (a) => a.type === "final",
    );

    let finalGradePercentage = course.finalGrade;
    if (
      (finalGradePercentage === null || finalGradePercentage === undefined) &&
      finalAssessment
    ) {
      finalGradePercentage =
        (finalAssessment.score / finalAssessment.maxScore) * 100;
    }

    if (finalGradePercentage === null || finalGradePercentage === undefined) {
      return;
    }

    const credits = parseFloat(course.credits) || 3;
    completedWeightedGrade += gradeToGPA(finalGradePercentage) * credits;
    completedCredits += credits;
  });

  // Use each course's saved aiPrediction; fall back to rule-based if not yet predicted
  const activeCoursePredictions = activeCourses.map((course) => {
    const currentPerformance = calculateCurrentPerformance(
      course.assessments || [],
    );
    const credits = parseFloat(course.credits) || 3;

    let prediction;
    if (course.aiPrediction && course.aiPrediction.predictedAt) {
      prediction = {
        min: course.aiPrediction.min,
        max: course.aiPrediction.max,
        confidence: course.aiPrediction.confidence,
        similarCourses: course.aiPrediction.similarCourses || [],
        usedAI: course.aiPrediction.usedAI,
      };
    } else {
      prediction = predictFinalGradeFallback(currentPerformance);
      prediction.usedAI = false;
      prediction.confidence = calculateConfidenceFromPrediction(
        currentPerformance,
        prediction.min,
        prediction.max,
      );
    }

    return {
      courseId: course._id,
      courseName: course.name,
      courseCode: course.code,
      currentPerformance,
      prediction,
      credits,
    };
  });

  let minWeightedGrade = completedWeightedGrade;
  let minTotalCredits = completedCredits;
  activeCoursePredictions.forEach((pred) => {
    minWeightedGrade += gradeToGPA(pred.prediction.min) * pred.credits;
    minTotalCredits += pred.credits;
  });

  let maxWeightedGrade = completedWeightedGrade;
  let maxTotalCredits = completedCredits;
  activeCoursePredictions.forEach((pred) => {
    maxWeightedGrade += gradeToGPA(pred.prediction.max) * pred.credits;
    maxTotalCredits += pred.credits;
  });

  const minGPA = minTotalCredits > 0 ? minWeightedGrade / minTotalCredits : 0;
  const maxGPA = maxTotalCredits > 0 ? maxWeightedGrade / maxTotalCredits : 0;
  const currentGPA =
    completedCredits > 0 ? completedWeightedGrade / completedCredits : 0;

  return {
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
  };
};

// @desc    Get predicted GPA (returns cached result from DB — no Gemini call)
// @route   GET /api/courses/predicted-gpa
// @access  Private
exports.getPredictedGPA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user && user.gpaCache && user.gpaCache.data) {
      return res.status(200).json({
        ...user.gpaCache.data,
        cachedAt: user.gpaCache.cachedAt,
        fromCache: true,
      });
    }
    // No cache yet — return empty-state response so frontend can prompt user to refresh
    return res.status(200).json({
      success: true,
      currentGPA: 0,
      predictedGPA: { min: 0, max: 0 },
      breakdown: { completedCourses: 0, activeCourses: 0, totalCredits: 0 },
      activeCoursePredictions: [],
      cachedAt: null,
      fromCache: false,
    });
  } catch (error) {
    console.error("Predicted GPA error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching predicted GPA" });
  }
};

// @desc    Refresh predicted GPA — runs Gemini AI and saves result to DB
// @route   POST /api/courses/predicted-gpa/refresh
// @access  Private
exports.refreshPredictedGPA = async (req, res) => {
  try {
    const result = await computePredictedGPA(req.user._id);
    const now = new Date();
    await User.findByIdAndUpdate(req.user._id, {
      "gpaCache.data": result,
      "gpaCache.cachedAt": now,
    });
    return res.status(200).json({ ...result, cachedAt: now, fromCache: false });
  } catch (error) {
    console.error("Refresh predicted GPA error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error refreshing predicted GPA" });
  }
};

// @desc    Run AI prediction for a single active course and save to Course document
// @route   POST /api/courses/:id/predict
// @access  Private
exports.predictSingleCourse = async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Build past courses dataset from completed courses
    const allCourses = await Course.find({ userId: req.user._id });
    const completedCourses = allCourses.filter((c) => c.isOldCourse === true);

    const pastCoursesForAI = [];
    completedCourses.forEach((c) => {
      const finalAssessment = (c.assessments || []).find(
        (a) => a.type === "final",
      );
      let finalGrade = c.finalGrade;
      if (finalGrade == null && finalAssessment) {
        finalGrade = (finalAssessment.score / finalAssessment.maxScore) * 100;
      }
      if (finalGrade == null) return;

      const currentPerf = calculateCurrentPerformance(c.assessments || []);
      pastCoursesForAI.push({
        code: c.code,
        name: c.name,
        outline_text: c.outlineText || c.name,
        current_performance: currentPerf ?? finalGrade,
        final_grade: finalGrade,
      });
    });

    const currentPerformance = calculateCurrentPerformance(
      course.assessments || [],
    );
    let prediction;

    if (pastCoursesForAI.length > 0) {
      try {
        const aiResult = await calculateAIPrediction(
          {
            code: course.code,
            name: course.name,
            outline_text: course.outlineText || course.name,
            current_performance: currentPerformance ?? 0,
          },
          pastCoursesForAI,
        );

        const predictedScore = aiResult.predicted_score_pct;
        const validPrediction = Number.isFinite(predictedScore)
          ? predictedScore
          : (currentPerformance ?? 0);

        prediction = {
          min: Math.max(Math.round(validPrediction - 3), 0),
          max: Math.min(Math.round(validPrediction + 3), 100),
          confidence: aiResult.confidence,
          similarCourses: (aiResult.similar_courses || []).map((sc) => ({
            name: sc.name || sc.courseId,
            similarity: sc.similarity || sc.similarity_score || 0,
            reason: sc.reason,
          })),
          usedAI: !aiResult.error,
        };
      } catch (err) {
        console.error("AI prediction failed, using fallback:", err.message);
        prediction = predictFinalGradeFallback(currentPerformance);
        prediction.usedAI = false;
        prediction.confidence = calculateConfidenceFromPrediction(
          currentPerformance,
          prediction.min,
          prediction.max,
        );
      }
    } else {
      prediction = predictFinalGradeFallback(currentPerformance);
      prediction.usedAI = false;
      prediction.confidence = calculateConfidenceFromPrediction(
        currentPerformance,
        prediction.min,
        prediction.max,
      );
    }

    // Save to the course document
    await Course.findByIdAndUpdate(course._id, {
      aiPrediction: {
        min: prediction.min,
        max: prediction.max,
        confidence: prediction.confidence,
        similarCourses: prediction.similarCourses,
        usedAI: prediction.usedAI,
        predictedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      courseId: course._id,
      currentPerformance,
      prediction,
    });
  } catch (error) {
    console.error("predictSingleCourse error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error predicting course grade" });
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
            semester: `${activeSemesterName} (Predicted)`,
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
// Shared helper — runs the full AI recommendations calculation and returns the result array
const computeAIRecommendations = async (userId, language = "en") => {
  const courses = await Course.find({ userId });
  const activeCourses = courses.filter((c) => c.isOldCourse !== true);

  if (activeCourses.length === 0) {
    return [];
  }

  const mappedActiveCourses = activeCourses.map((course) => {
    const currentPerf = calculateCurrentPerformance(course.assessments || []);
    return {
      code: course.code,
      name: course.name,
      currentPerformance: currentPerf,
      tasks: course.tasks || [],
      assessments: course.assessments || [],
      phases: course.phases || [],
    };
  });

  const aiResult = await generateActionableRecommendations(mappedActiveCourses, language);
  return aiResult.recommendations || [];
};

// @desc    Get AI recommendations (returns cached result from DB — no Gemini call)
// @route   GET /api/courses/recommendations
// @access  Private
exports.getAIRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user && user.recommendationsCache && user.recommendationsCache.data) {
      return res.status(200).json({
        success: true,
        data: user.recommendationsCache.data,
        cachedAt: user.recommendationsCache.cachedAt,
        fromCache: true,
      });
    }
    return res.status(200).json({
      success: true,
      data: [],
      cachedAt: null,
      fromCache: false,
    });
  } catch (error) {
    console.error("❌ AI recommendations error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching recommendations" });
  }
};

// @desc    Refresh AI recommendations — runs Gemini and saves to DB
// @route   POST /api/courses/recommendations/refresh
// @access  Private
exports.refreshAIRecommendations = async (req, res) => {
  try {
    const language = String(req.body?.language || "en").trim().toLowerCase();
    const safeLanguage = ["en", "ar"].includes(language) ? language : "en";
    const recommendations = await computeAIRecommendations(req.user._id, safeLanguage);
    const now = new Date();
    await User.findByIdAndUpdate(req.user._id, {
      "recommendationsCache.data": recommendations,
      "recommendationsCache.cachedAt": now,
    });
    return res.status(200).json({
      success: true,
      data: recommendations,
      cachedAt: now,
      fromCache: false,
    });
  } catch (error) {
    console.error("❌ Refresh AI recommendations error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error refreshing recommendations" });
  }
};

// @desc    Generate structured study summary
// @route   POST /api/courses/summarize
// @access  Private
exports.summarizeCourseContent = async (req, res) => {
  try {
    const {
      sourceType = "text",
      text = "",
      mode = "quick",
      courseId,
    } = req.body;
    const summaryOptions = parseSummaryOptionsFromBody(req.body);

    const allowedSourceTypes = ["text", "courseOutline", "file"];
    if (!allowedSourceTypes.includes(sourceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sourceType. Use text, courseOutline, or file",
      });
    }

    const allowedModes = ["quick", "detailed", "exam", "action", "custom"];
    const selectedMode = allowedModes.includes(mode) ? mode : "quick";

    let content = (text || "").trim();
    let courseContext = null;

    if (sourceType === "courseOutline") {
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: "courseId is required when sourceType is courseOutline",
        });
      }

      const course = await Course.findOne({
        _id: courseId,
        userId: req.user._id,
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      const outline = (course.outlineText || "").trim();

      if (!outline) {
        return res.status(400).json({
          success: false,
          message: "Selected course has no outline text to summarize",
        });
      }

      content = outline;
      courseContext = {
        id: course._id,
        code: course.code,
        name: course.name,
      };
    }

    if (!content || content.length < 20) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least 20 characters of content to summarize",
      });
    }

    const summaryResult = await generateStructuredSummary({
      content,
      mode: selectedMode,
      courseContext,
      options: summaryOptions,
    });

    res.status(200).json({
      success: true,
      data: {
        sourceType,
        mode: selectedMode,
        options: summaryOptions,
        result: summaryResult,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Summarizer error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating summary",
      error: error.message,
    });
  }
};

// @desc    Summarize uploaded content with OCR fallback support
// @route   POST /api/summarize/upload
// @access  Private
exports.summarizeUploadedDocument = async (req, res) => {
  let parsedImages = [];

  try {
    const text = (req.body?.text || "").trim();
    const sourceType = req.body?.sourceType || "file";
    const mode = req.body?.mode || "quick";
    const summaryOptions = parseSummaryOptionsFromBody(req.body);
    const rawImages = req.body?.ocrImages || "[]";

    if (rawImages) {
      try {
        const imagesCandidate = JSON.parse(rawImages);
        if (Array.isArray(imagesCandidate)) {
          parsedImages = imagesCandidate
            .map(normalizeImageData)
            .filter(Boolean)
            .slice(0, 10);
        }
      } catch (parseError) {
        return res.status(400).json({
          error: "Invalid ocrImages payload",
          type: "INVALID_UPLOAD_PAYLOAD",
        });
      }
    }

    if (!text && parsedImages.length === 0 && !req.file) {
      return res.status(400).json({
        error: "No upload content provided",
        type: "INVALID_UPLOAD_PAYLOAD",
      });
    }

    // If we have extracted text, use generateStructuredSummary which has fallback support.
    // Only use the direct Gemini multimodal call when we only have OCR images (no text).
    if (text && text.length >= 20) {
      const summaryResult = await generateStructuredSummary({
        content: text,
        mode,
        sourceType,
        options: summaryOptions,
      });

      // Normalize to the upload response schema
      const result = {
        overview:
          summaryResult.summary || summaryResult.plainLanguageSummary || "",
        keyTopics: summaryResult.learningOutcomes || [],
        importantDefinitions: summaryResult.importantTerms || [],
        studyPlan: summaryResult.studyPlan || summaryResult.actionItems || [],
        possibleQuestions: summaryResult.possibleQuestions || [],
      };

      return res.status(200).json({
        success: true,
        data: { mode, sourceType, options: summaryOptions, result },
      });
    }

    // OCR-only path: images with no text layer OR handwritten notes
    const isHandwritten = req.body.isHandwritten === "true";

    const systemInstructionText = isHandwritten
      ? `You are an expert academic assistant. The input is a photo of handwritten student notes. ` +
        `First, carefully transcribe ALL handwritten text you can read (ignore ruled lines or paper artifacts), ` +
        `then organise the content into the UniMate study schema ` +
        `(overview, keyTopics, importantDefinitions, studyPlan, possibleQuestions).`
      : `You are an expert academic assistant. The input is a scanned document image. ` +
        `First, transcribe the text accurately (ignoring noise/artifacts), then format it into ` +
        `the UniMate study schema (overview, keyTopics, importantDefinitions, studyPlan, possibleQuestions).`;

    const modeFieldInstructions = {
      quick: `QUICK MODE — populate ONLY:
- overview: 1-2 sentences, the core idea only.
- keyTopics: 4-6 short key takeaways.
- importantDefinitions: return []
- studyPlan: return []
- possibleQuestions: return []`,
      detailed: `DETAILED MODE — populate ALL fields fully:
- overview: 3-4 sentences synthesizing the full picture.
- keyTopics: 6-8 topics/outcomes with verbs (explain, compare, apply).
- importantDefinitions: 6-8 terms with short definitions.
- studyPlan: 5-6 ordered steps for deep learning.
- possibleQuestions: 4-5 likely questions.`,
      exam: `EXAM FOCUS MODE — exam prep only:
- overview: 2 sentences max, what is most testable.
- keyTopics: 4-5 highly specific exam-focus bullets.
- importantDefinitions: 5-7 must-know terms with definitions.
- studyPlan: 3-4 steps — a tight revision plan for an upcoming test.
- possibleQuestions: 5-6 realistic instructor-style exam questions.`,
      custom: (() => {
        const len = summaryOptions.length || "medium";
        const focus = summaryOptions.focus || "general";
        const counts = {
          short: {
            overview: "1-2",
            topics: "3-4",
            defs: "3-5",
            plan: "2-3",
            questions: "2-3",
          },
          medium: {
            overview: "2-3",
            topics: "4-5",
            defs: "4-6",
            plan: "3-4",
            questions: "3-4",
          },
          long: {
            overview: "3-4",
            topics: "5-7",
            defs: "6-8",
            plan: "4-6",
            questions: "4-6",
          },
        }[len] || {
          overview: "2-3",
          topics: "4-5",
          defs: "4-6",
          plan: "3-4",
          questions: "3-4",
        };
        const skipPlan = focus === "exam";
        const moreQuestions = focus === "exam";
        return `CUSTOM MODE (length: ${len}, focus: ${focus}):
- overview: ${counts.overview} sentences.
- keyTopics: ${counts.topics} items${focus === "exam" ? " — emphasise what is most testable" : focus === "action" ? " — emphasise what to practise first" : ""}.
- importantDefinitions: ${counts.defs} terms with short definitions.
- studyPlan: ${skipPlan ? "return []" : `${counts.plan} ordered steps`}.
- possibleQuestions: ${moreQuestions ? `${counts.questions} realistic exam-style questions` : `${counts.questions} likely questions`}.`;
      })(),
    };

    const activeModeInstructions =
      modeFieldInstructions[mode] || modeFieldInstructions.custom;

    const promptText = `${systemInstructionText}

Summary mode: ${mode}
${activeModeInstructions}
${buildUploadOptionPrompt(mode, summaryOptions)}

Rules:
- Return strictly valid JSON only.
- Keep content concise, academic, and useful.
- If Arabic is selected, every response sentence must be Arabic.
- If Arabic is selected, use natural academic Arabic phrasing and include original English technical terms in parentheses when relevant.
- If the source lacks evidence for a field, return [] or "N/A" instead of inventing details.
- Keep JSON keys in English exactly as requested.`;

    const parts = [{ text: promptText }];

    if (parsedImages.length > 0) {
      parsedImages.forEach((image) => {
        parts.push({
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        });
      });
    }

    const result = await callGeminiUploadSummary(parts);

    if (!result || typeof result !== "object") {
      return res.status(422).json({
        error: "Document too blurry or unreadable",
        type: "OCR_FAILURE",
      });
    }

    const hasUsableContent =
      (result.overview && result.overview.trim().length > 20) ||
      (Array.isArray(result.keyTopics) && result.keyTopics.length > 0);

    if (!hasUsableContent) {
      return res.status(422).json({
        error: "Document too blurry or unreadable",
        type: "OCR_FAILURE",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        mode,
        sourceType,
        options: summaryOptions,
        result,
      },
    });
  } catch (error) {
    console.error("Upload summarize error:", error);

    if (parsedImages.length > 0) {
      return res.status(422).json({
        error: "Document too blurry or unreadable",
        type: "OCR_FAILURE",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error summarizing uploaded document",
      error: error.message,
    });
  } finally {
    if (req.file) {
      req.file.buffer = null;
    }

    parsedImages = [];
  }
};
