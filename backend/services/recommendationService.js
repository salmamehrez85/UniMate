const Quiz = require("../model/Quiz");
const TopicMastery = require("../model/TopicMastery");

const DEFAULT_RECOMMENDATION_CONFIG = {
  overlapThreshold: 0.3,
  mediumMasteryThreshold: 70,
  staleHighMasteryDays: 7,
  staleMediumMasteryDays: 3,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getDaysSince = (date, now) => {
  const normalizedDate = toDate(date);

  if (!normalizedDate) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((now.getTime() - normalizedDate.getTime()) / DAY_IN_MS);
};

const shouldScheduleTagReview = (
  topicMastery,
  now,
  config = DEFAULT_RECOMMENDATION_CONFIG,
) => {
  if (topicMastery.needsReview) {
    return true;
  }

  const lastSeenAt = toDate(topicMastery.lastSeenAt || topicMastery.updatedAt);
  const daysSinceLastPractice = getDaysSince(lastSeenAt, now);

  if (topicMastery.masteryScore >= config.mediumMasteryThreshold) {
    return daysSinceLastPractice >= config.staleHighMasteryDays;
  }

  return daysSinceLastPractice >= config.staleMediumMasteryDays;
};

const buildTargetTopics = (
  topicMasteries,
  now,
  config = DEFAULT_RECOMMENDATION_CONFIG,
) => {
  const targetTopics = new Map();

  for (const topicMastery of topicMasteries) {
    if (!shouldScheduleTagReview(topicMastery, now, config)) {
      continue;
    }

    const daysSinceLastPractice = getDaysSince(
      topicMastery.lastSeenAt || topicMastery.updatedAt,
      now,
    );

    const reason = topicMastery.needsReview
      ? "needs_review"
      : topicMastery.masteryScore >= config.mediumMasteryThreshold
        ? "stale_high_mastery"
        : "stale_medium_mastery";

    targetTopics.set(topicMastery.tag, {
      tag: topicMastery.tag,
      reason,
      masteryScore: topicMastery.masteryScore,
      daysSinceLastPractice,
    });
  }

  return targetTopics;
};

const getQuizQuestionTags = (quiz) => {
  if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
    return quiz.questions.map((question) => {
      const uniqueTags = Array.isArray(question.subTopicTags)
        ? Array.from(new Set(question.subTopicTags.filter(Boolean)))
        : [];

      return {
        questionId: question.questionId,
        tags: uniqueTags,
      };
    });
  }

  if (
    Array.isArray(quiz.subTopicCoverage) &&
    quiz.subTopicCoverage.length > 0
  ) {
    return quiz.subTopicCoverage.map((tag, index) => ({
      questionId: `coverage-${index}`,
      tags: [tag],
    }));
  }

  return [];
};

const buildRecommendationMetadata = (
  quiz,
  targetTopics,
  config = DEFAULT_RECOMMENDATION_CONFIG,
) => {
  const questionTagRows = getQuizQuestionTags(quiz);
  const totalUnits = questionTagRows.length;

  if (totalUnits === 0) {
    return {
      isRecommended: false,
      overlapRatio: 0,
      matchedTargetTags: [],
      recommendationReason: null,
    };
  }

  const matchedUnits = questionTagRows.filter((row) =>
    row.tags.some((tag) => targetTopics.has(tag)),
  );
  const matchedTargetTags = Array.from(
    new Set(
      matchedUnits.flatMap((row) =>
        row.tags.filter((tag) => targetTopics.has(tag)),
      ),
    ),
  );
  const overlapRatio = matchedUnits.length / totalUnits;
  const isRecommended = overlapRatio >= config.overlapThreshold;

  return {
    isRecommended,
    overlapRatio: Number(overlapRatio.toFixed(2)),
    matchedTargetTags,
    recommendationReason: isRecommended
      ? `Targets ${matchedTargetTags.join(", ")} with ${Math.round(overlapRatio * 100)}% topic overlap`
      : null,
  };
};

const getAvailableQuizzes = async (userId, courseId, options = {}) => {
  const config = {
    ...DEFAULT_RECOMMENDATION_CONFIG,
    ...options,
  };
  const now = toDate(options.now) || new Date();

  const [quizzes, topicMasteries] = await Promise.all([
    Quiz.find({
      userId,
      courseId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean(),
    TopicMastery.find({ userId, courseId }).lean(),
  ]);

  const targetTopics = buildTargetTopics(topicMasteries, now, config);

  const recommendedQuizzes = quizzes
    .map((quiz) => {
      const recommendation = buildRecommendationMetadata(
        quiz,
        targetTopics,
        config,
      );

      return {
        ...quiz,
        isRecommended: recommendation.isRecommended,
        overlapRatio: recommendation.overlapRatio,
        matchedTargetTags: recommendation.matchedTargetTags,
        recommendationReason:
          recommendation.recommendationReason ||
          quiz.recommendationReason ||
          null,
      };
    })
    .sort((leftQuiz, rightQuiz) => {
      if (leftQuiz.isRecommended !== rightQuiz.isRecommended) {
        return leftQuiz.isRecommended ? -1 : 1;
      }

      if (leftQuiz.isRecommended && rightQuiz.isRecommended) {
        if (leftQuiz.overlapRatio !== rightQuiz.overlapRatio) {
          return rightQuiz.overlapRatio - leftQuiz.overlapRatio;
        }
      }

      return (
        new Date(rightQuiz.createdAt).getTime() -
        new Date(leftQuiz.createdAt).getTime()
      );
    });

  return {
    quizzes: recommendedQuizzes,
    targetTopics: Array.from(targetTopics.values()),
  };
};

module.exports = {
  DEFAULT_RECOMMENDATION_CONFIG,
  buildTargetTopics,
  getAvailableQuizzes,
  shouldScheduleTagReview,
};
