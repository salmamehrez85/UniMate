const Quiz = require("../model/Quiz");
const QuizResult = require("../model/QuizResult");
const TopicMastery = require("../model/TopicMastery");

const DEFAULT_EVALUATION_CONFIG = {
  weakAreaThreshold: 70,
  defaultMasteryScore: 50,
  correctLearningRate: 0.2,
  incorrectLearningRate: 0.3,
  confidenceStep: 0.08,
  maxConfidence: 0.95,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeScalarAnswer = (value) => {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim().toLowerCase();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return JSON.stringify(value).trim().toLowerCase();
};

const normalizeAnswer = (answer) => {
  if (Array.isArray(answer)) {
    return answer
      .map((item) => normalizeScalarAnswer(item))
      .filter(Boolean)
      .sort();
  }

  return normalizeScalarAnswer(answer);
};

const answersMatch = (submittedAnswer, correctAnswer) => {
  const normalizedSubmitted = normalizeAnswer(submittedAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  if (Array.isArray(normalizedSubmitted) || Array.isArray(normalizedCorrect)) {
    if (
      !Array.isArray(normalizedSubmitted) ||
      !Array.isArray(normalizedCorrect) ||
      normalizedSubmitted.length !== normalizedCorrect.length
    ) {
      return false;
    }

    return normalizedSubmitted.every(
      (value, index) => value === normalizedCorrect[index],
    );
  }

  if (!normalizedSubmitted || !normalizedCorrect) {
    return false;
  }

  return normalizedSubmitted === normalizedCorrect;
};

const buildAnswerMap = (userAnswers) => {
  if (!userAnswers) {
    return new Map();
  }

  if (Array.isArray(userAnswers)) {
    return new Map(
      userAnswers
        .filter((entry) => entry && entry.questionId)
        .map((entry) => [entry.questionId, entry]),
    );
  }

  if (typeof userAnswers === "object") {
    return new Map(
      Object.entries(userAnswers).map(([questionId, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return [questionId, { questionId, ...value }];
        }

        return [questionId, { questionId, answer: value }];
      }),
    );
  }

  return new Map();
};

const calculateUpdatedMastery = (
  currentMasteryScore,
  isCorrect,
  config = DEFAULT_EVALUATION_CONFIG,
) => {
  const learningRate = isCorrect
    ? config.correctLearningRate
    : config.incorrectLearningRate;
  const targetScore = isCorrect ? 100 : 0;

  // Exponential moving average keeps history but gives the newest answer more influence.
  const updatedMasteryScore =
    currentMasteryScore + (targetScore - currentMasteryScore) * learningRate;

  return clamp(Math.round(updatedMasteryScore), 0, 100);
};

const updateTopicMasteryDocument = ({
  masteryDoc,
  userId,
  courseId,
  tag,
  isCorrect,
  completedAt,
  quizResultId,
  config,
}) => {
  const topicMastery =
    masteryDoc ||
    new TopicMastery({
      userId,
      courseId,
      tag,
      masteryScore: config.defaultMasteryScore,
    });

  topicMastery.masteryScore = calculateUpdatedMastery(
    topicMastery.masteryScore,
    isCorrect,
    config,
  );
  topicMastery.attempts += 1;
  topicMastery.correctAttempts += isCorrect ? 1 : 0;
  topicMastery.incorrectAttempts += isCorrect ? 0 : 1;
  topicMastery.confidence = clamp(
    topicMastery.confidence + config.confidenceStep,
    0,
    config.maxConfidence,
  );
  topicMastery.lastSeenAt = completedAt;
  topicMastery.lastQuizResultId = quizResultId;
  topicMastery.needsReview =
    topicMastery.masteryScore < config.weakAreaThreshold;

  if (!topicMastery.needsReview) {
    topicMastery.lastMasteredAt = completedAt;
  }

  return topicMastery;
};

const getAttemptNumber = async (userId, quizId) => {
  const latestAttempt = await QuizResult.findOne({ userId, quizId })
    .sort({ attemptNumber: -1 })
    .select("attemptNumber")
    .lean();

  return (latestAttempt?.attemptNumber || 0) + 1;
};

const evaluateQuizSubmission = async (
  userId,
  quizId,
  userAnswers,
  options = {},
) => {
  const config = {
    ...DEFAULT_EVALUATION_CONFIG,
    ...options,
  };

  const quiz = await Quiz.findOne({ _id: quizId, userId }).lean();

  if (!quiz) {
    throw new Error("Quiz not found for this user");
  }

  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error("Quiz has no questions to evaluate");
  }

  const answerMap = buildAnswerMap(userAnswers);

  if (answerMap.size === 0) {
    throw new Error("No quiz answers were submitted");
  }

  const completedAt = options.completedAt || new Date();
  const attemptedQuestionRows = [];
  const touchedTags = new Set();

  let earnedPoints = 0;
  let totalPossiblePoints = 0;
  let correctAnswers = 0;

  for (const question of quiz.questions) {
    const maxPoints = question.points || 1;
    totalPossiblePoints += maxPoints;

    const answerEntry = answerMap.get(question.questionId);

    if (!answerEntry) {
      continue;
    }

    const selectedAnswer =
      typeof answerEntry.answer === "undefined"
        ? answerEntry.selectedAnswer
        : answerEntry.answer;

    const isCorrect = answersMatch(selectedAnswer, question.correctAnswer);
    const pointsEarned = isCorrect ? maxPoints : 0;

    if (isCorrect) {
      correctAnswers += 1;
      earnedPoints += pointsEarned;
    }

    question.subTopicTags.forEach((tag) => touchedTags.add(tag));

    attemptedQuestionRows.push({
      questionId: question.questionId,
      prompt: question.prompt,
      subTopicTags: question.subTopicTags,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      pointsEarned,
      maxPoints,
      responseTimeSeconds: answerEntry.responseTimeSeconds,
    });
  }

  if (attemptedQuestionRows.length === 0) {
    throw new Error("Submitted answers do not match this quiz's questions");
  }

  const score = Math.round((earnedPoints / totalPossiblePoints) * 100);
  const attemptNumber = await getAttemptNumber(userId, quizId);

  const quizResult = new QuizResult({
    userId,
    courseId: quiz.courseId,
    quizId: quiz._id,
    score,
    correctAnswers,
    totalQuestions: quiz.questions.length,
    weakAreas: [],
    answeredQuestions: attemptedQuestionRows,
    completedAt,
    attemptNumber,
    submissionSource: options.submissionSource || "practice",
  });

  const existingTopicMasteries = await TopicMastery.find({
    userId,
    courseId: quiz.courseId,
    tag: { $in: Array.from(touchedTags) },
  });

  const masteryByTag = new Map(
    existingTopicMasteries.map((topicMastery) => [
      topicMastery.tag,
      topicMastery,
    ]),
  );

  for (const answeredQuestion of attemptedQuestionRows) {
    for (const tag of answeredQuestion.subTopicTags) {
      const updatedTopicMastery = updateTopicMasteryDocument({
        masteryDoc: masteryByTag.get(tag),
        userId,
        courseId: quiz.courseId,
        tag,
        isCorrect: answeredQuestion.isCorrect,
        completedAt,
        quizResultId: quizResult._id,
        config,
      });

      masteryByTag.set(tag, updatedTopicMastery);
    }
  }

  await Promise.all(
    Array.from(masteryByTag.values()).map((topicMastery) =>
      topicMastery.save(),
    ),
  );

  const weakAreaDocs = await TopicMastery.find({
    userId,
    courseId: quiz.courseId,
    needsReview: true,
  })
    .sort({ masteryScore: 1, tag: 1 })
    .select("tag masteryScore");

  const weakAreas = weakAreaDocs.map((topicMastery) => topicMastery.tag);
  quizResult.weakAreas = weakAreas;

  await quizResult.save();

  return {
    quizResult,
    weakAreas,
    topicMasterySnapshot: weakAreaDocs,
  };
};

module.exports = {
  DEFAULT_EVALUATION_CONFIG,
  answersMatch,
  calculateUpdatedMastery,
  evaluateQuizSubmission,
};
