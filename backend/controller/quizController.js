const { evaluateQuizSubmission } = require("../services/quizEvaluationService");
const { generatePracticeQuiz } = require("../services/quizGenerationService");
const { getAvailableQuizzes } = require("../services/recommendationService");
const { createNotification } = require("../services/notificationService");
const QuizResult = require("../model/QuizResult");
const Quiz = require("../model/Quiz");
const Course = require("../model/Course");

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
      language,
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
      language,
    });

    // Fire-and-forget notification — don't block the response
    Course.findById(courseId)
      .lean()
      .then((course) => {
        if (!course) return;
        const prefs = {}; // prefs checked server-side in createNotification
        return createNotification({
          userId,
          type: "quiz",
          title: `New quiz ready: ${course.name || course.code}`,
          message: `A new ${difficulty || "mixed"} difficulty quiz with ${result.quiz.questions?.length || numberOfQuestions || "multiple"} questions has been generated for ${course.name || course.code}. Start practicing now!`,
          metadata: { courseId, quizId: result.quiz._id },
        });
      })
      .catch(() => {});

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

    // Fire-and-forget notifications after quiz submission
    Promise.resolve().then(async () => {
      try {
        const qr = result.quizResult;
        const pct = Math.round(qr?.score ?? 0);
        const correct = qr?.correctAnswers ?? 0;
        const total = qr?.totalQuestions ?? 0;

        // Fetch course name for richer messages
        const quiz = await Quiz.findById(quizId).select("courseId").lean();
        const course = quiz
          ? await Course.findById(quiz.courseId).select("name code").lean()
          : null;
        const courseName = course ? course.name || course.code : "your course";

        // 1. Quiz result notification
        const resultEmoji =
          pct >= 80
            ? "Great work!"
            : pct >= 60
              ? "Good effort."
              : "Keep practicing.";
        await createNotification({
          userId,
          type: "quiz",
          title: `Quiz result: ${pct}% — ${courseName}`,
          message: `You scored ${correct}/${total} (${pct}%) on your ${courseName} quiz. ${resultEmoji}`,
          metadata: { quizId, courseId: quiz?.courseId, score: pct, total, pct },
        });

        // 2. Weak areas notification (only if score < 70% and weak areas exist)
        const weakAreas = result.weakAreas || [];
        if (pct < 70 && weakAreas.length > 0) {
          const topWeak = weakAreas.slice(0, 3).join(", ");
          await createNotification({
            userId,
            type: "performance",
            title: `Weak areas detected — ${courseName}`,
            message: `You struggled with: ${topWeak}. Consider reviewing these topics before your next quiz.`,
            metadata: { quizId, courseId: quiz?.courseId, weakAreas },
          });
        }
      } catch (err) {
        console.error(
          "[Notifications] submitQuiz post-processing failed:",
          err.message,
        );
      }
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

// @desc    Get all quiz results for a course with aggregated weak areas
// @route   GET /api/quizzes/results/:courseId
// @access  Private
exports.getResultsByCourse = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { courseId } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User authentication is required" });
    }
    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "courseId is required" });
    }

    // Fetch all results for this user + course, newest first
    const results = await QuizResult.find({ userId, courseId })
      .sort({ completedAt: -1 })
      .lean();

    // Attach quiz title to each result
    const quizIds = [...new Set(results.map((r) => r.quizId.toString()))];
    const quizDocs = await Quiz.find(
      { _id: { $in: quizIds } },
      "title difficulty",
    ).lean();
    const quizMap = Object.fromEntries(
      quizDocs.map((q) => [q._id.toString(), q]),
    );

    const enrichedResults = results.map((r) => ({
      _id: r._id,
      quizId: r.quizId,
      quizTitle: quizMap[r.quizId.toString()]?.title || "Practice Quiz",
      difficulty: quizMap[r.quizId.toString()]?.difficulty || "mixed",
      score: r.score,
      correctAnswers: r.correctAnswers,
      totalQuestions: r.totalQuestions,
      weakAreas: r.weakAreas || [],
      completedAt: r.completedAt,
      attemptNumber: r.attemptNumber,
      submissionSource: r.submissionSource,
    }));

    // Aggregate weak areas across all results
    const weakAreaFrequency = {};
    results.forEach((r) => {
      (r.weakAreas || []).forEach((topic) => {
        weakAreaFrequency[topic] = (weakAreaFrequency[topic] || 0) + 1;
      });
    });

    const aggregatedWeakAreas = Object.entries(weakAreaFrequency)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    // Compute overall stats
    const totalAttempts = results.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.score, 0) / totalAttempts,
          )
        : 0;
    const bestScore =
      totalAttempts > 0 ? Math.max(...results.map((r) => r.score)) : 0;
    const latestScore = totalAttempts > 0 ? results[0].score : null;

    return res.status(200).json({
      success: true,
      stats: { totalAttempts, avgScore, bestScore, latestScore },
      results: enrichedResults,
      aggregatedWeakAreas,
    });
  } catch (error) {
    console.error("Get quiz results error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch quiz results",
      error: error.message,
    });
  }
};
