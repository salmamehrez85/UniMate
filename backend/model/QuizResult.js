const mongoose = require("mongoose");

const answeredQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    subTopicTags: {
      type: [String],
      required: true,
      default: [],
    },
    selectedAnswer: {
      type: mongoose.Schema.Types.Mixed,
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxPoints: {
      type: Number,
      default: 1,
      min: 1,
    },
    responseTimeSeconds: {
      type: Number,
      min: 0,
    },
  },
  { _id: false },
);

const spacedRepetitionSchema = new mongoose.Schema(
  {
    repetitions: {
      type: Number,
      default: 0,
      min: 0,
    },
    intervalDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    nextReviewAt: {
      type: Date,
    },
    lastQualityScore: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  { _id: false },
);

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    weakAreas: {
      type: [String],
      default: [],
    },
    answeredQuestions: {
      type: [answeredQuestionSchema],
      default: [],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    submissionSource: {
      type: String,
      enum: ["practice", "review", "custom_generation"],
      default: "practice",
    },
    spacedRepetition: {
      type: spacedRepetitionSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

quizResultSchema.index({ userId: 1, completedAt: -1 });
quizResultSchema.index({
  userId: 1,
  courseId: 1,
  quizId: 1,
  attemptNumber: -1,
});

const QuizResult = mongoose.model("QuizResult", quizResultSchema);

module.exports = QuizResult;
