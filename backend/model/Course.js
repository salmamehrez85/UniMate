const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  id: String,
  title: String,
  type: { type: String, enum: ["quiz", "midterm", "final", "assignment"] },
  score: Number,
  maxScore: Number,
  date: Date,
  weight: Number,
});

const taskSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  dueDate: Date,
  dueTime: String,
  status: { type: String, enum: ["todo", "doing", "done"], default: "todo" },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  createdAt: { type: Date, default: Date.now },
});

const requirementSchema = new mongoose.Schema({
  id: String,
  text: String,
  completed: { type: Boolean, default: false },
});

const phaseSchema = new mongoose.Schema({
  id: String,
  title: String,
  dueDate: Date,
  requirements: [requirementSchema],
});

const courseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: {
      type: String,
      required: [true, "Please provide a course code"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Please provide a course name"],
      trim: true,
    },
    instructor: {
      type: String,
      trim: true,
    },
    schedule: {
      type: String,
      trim: true,
    },
    credits: {
      type: String,
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
    },
    assessments: [assessmentSchema],
    tasks: [taskSchema],
    phases: [phaseSchema],
  },
  {
    timestamps: true,
  },
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
