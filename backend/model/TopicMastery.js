const mongoose = require("mongoose");

const topicMasterySchema = new mongoose.Schema(
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
    tag: {
      type: String,
      required: true,
      trim: true,
    },
    masteryScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.25,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    incorrectAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSeenAt: {
      type: Date,
    },
    lastMasteredAt: {
      type: Date,
    },
    lastQuizResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizResult",
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

topicMasterySchema.index({ userId: 1, courseId: 1, tag: 1 }, { unique: true });
topicMasterySchema.index({ userId: 1, needsReview: 1, masteryScore: 1 });

const TopicMastery = mongoose.model("TopicMastery", topicMasterySchema);

module.exports = TopicMastery;
