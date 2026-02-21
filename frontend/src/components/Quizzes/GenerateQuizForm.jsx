import { Sparkles } from "lucide-react";

const COURSE_OPTIONS = [
  "CS 301 - Data Structures",
  "MATH 202 - Calculus II",
  "CS 305 - Database Systems",
];

export function GenerateQuizForm() {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-primary-900">
          Generate Custom Quiz
        </h2>
      </div>
      <div className="px-6 py-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition">
            {COURSE_OPTIONS.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition">
            <option value="all">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="choose">Choose</option>
            <option value="complete">Complete</option>
            <option value="truefalse">True/False</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              min="5"
              max="30"
              defaultValue="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
          <Sparkles className="w-5 h-5" />
          Generate Quiz
        </button>
      </div>
    </section>
  );
}
