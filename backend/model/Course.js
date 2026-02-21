const mongoose = require("mongoose");

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
    title: {
      type: String,
      required: [true, "Please provide a course title"],
      trim: true,
    },
    instructor: {
      type: String,
      required: [true, "Please provide instructor name"],
      trim: true,
    },
    schedule: {
      type: String,
      required: [true, "Please provide course schedule"],
      trim: true,
    },
    tasks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
