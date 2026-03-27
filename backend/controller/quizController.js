const { evaluateQuizSubmission } = require("../services/quizEvaluationService");
const { generatePracticeQuiz } = require("../services/quizGenerationService");
const { getAvailableQuizzes } = require("../services/recommendationService");

const parseSourceContext = (value) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }

  return value;
};

// @desc    Generate a new AI-backed practice quiz
// @route   POST /api/quizzes/generate
// @access  Private
exports.generateQuiz = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const {
      courseId,
      numberOfQuestions,
      difficulty,
      questionType,
      sourceContext,
      useMock,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication is required",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const result = await generatePracticeQuiz({
      userId,
      courseId,
      numberOfQuestions,
      difficulty,
      questionType,
      sourceContext: parseSourceContext(sourceContext),
      useMock,
    });

    return res.status(201).json({
      success: true,
      message: "Quiz generated successfully",
      quiz: result.quiz,
    });
  } catch (error) {
    console.error("Generate quiz error:", error);

    if (error.code === "COURSE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.code === "INVALID_QUIZ_JSON" ||
      error.code === "INVALID_QUIZ_PAYLOAD"
    ) {
      return res.status(502).json({
        success: false,
        message: "The AI returned an invalid quiz payload",
        error: error.message,
      });
    }

    if (error.message && error.message.includes("Timed out")) {
      return res.status(504).json({
        success: false,
        message: "Quiz generation timed out",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate quiz",
      error: error.message,
    });
  }
};

// @desc    Submit a completed quiz for evaluation
// @route   POST /api/quizzes/submit
// @access  Private
exports.submitQuiz = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { quizId, userAnswers } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication is required",
      });
    }

    if (!quizId) {
      return res.status(400).json({
        success: false,
        message: "quizId is required",
      });
    }

    if (!userAnswers) {
      return res.status(400).json({
        success: false,
        message: "userAnswers is required",
      });
    }

    const result = await evaluateQuizSubmission(userId, quizId, userAnswers, {
      submissionSource: req.body.submissionSource,
      completedAt: req.body.completedAt,
    });

    return res.status(201).json({
      success: true,
      message: "Quiz submitted successfully",
      quizResult: result.quizResult,
      weakAreas: result.weakAreas,
      topicMasterySnapshot: result.topicMasterySnapshot,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);

    if (
      error.message === "Quiz not found for this user" ||
      error.message === "Quiz has no questions to evaluate"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "No quiz answers were submitted" ||
      error.message === "Submitted answers do not match this quiz's questions"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit quiz",
      error: error.message,
    });
  }
};

// @desc    Get available quizzes for a course with recommendation flags
// @route   GET /api/quizzes/available/:courseId
// @access  Private
exports.getAvailable = async (req, res) => {
  try {
    const userId = req.user?._id;
    const courseId = req.params.courseId || req.query.courseId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication is required",
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required",
      });
    }

    const result = await getAvailableQuizzes(userId, courseId);

    return res.status(200).json({
      success: true,
      count: result.quizzes.length,
      quizzes: result.quizzes,
      targetTopics: result.targetTopics,
    });
  } catch (error) {
    console.error("Get available quizzes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available quizzes",
      error: error.message,
    });
  }
};
