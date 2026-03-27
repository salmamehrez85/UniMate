const mongoose = require("mongoose");

const questionOptionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["mcq", "true_false", "short_answer", "multiple_select"],
      default: "mcq",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    options: {
      type: [questionOptionSchema],
      default: [],
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    explanation: {
      type: String,
      trim: true,
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
    estimatedSeconds: {
      type: Number,
      default: 60,
      min: 15,
    },
    subTopicTags: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: (tags) => Array.isArray(tags) && tags.length > 0,
        message: "Each question must include at least one subTopicTag",
      },
    },
    sourceChunks: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    generationType: {
      type: String,
      enum: ["manual", "rag_generated", "scheduled_review"],
      default: "rag_generated",
    },
    questionTypeFilter: {
      type: String,
      enum: ["all", "mcq", "true_false", "short_answer", "multiple_select"],
      default: "all",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "mixed",
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    estimatedDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    subTopicCoverage: {
      type: [String],
      default: [],
    },
    recommendedBySystem: {
      type: Boolean,
      default: false,
    },
    recommendationReason: {
      type: String,
      trim: true,
    },
    dueForReviewAt: {
      type: Date,
    },
    sourceContext: {
      materialIds: {
        type: [String],
        default: [],
      },
      retrievalQuery: {
        type: String,
        trim: true,
      },
      generatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

quizSchema.index({ userId: 1, courseId: 1, createdAt: -1 });
quizSchema.index({ userId: 1, recommendedBySystem: 1, dueForReviewAt: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
