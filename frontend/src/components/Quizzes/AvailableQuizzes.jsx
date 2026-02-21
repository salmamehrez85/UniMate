import { Play, BookOpen, Clock, Sparkles } from "lucide-react";

const QUIZZES_DATA = [
  {
    id: 1,
    title: "Sorting Algorithms Review",
    course: "CS 301",
    questions: 10,
    duration: "15 min",
    recommended: false,
  },
  {
    id: 2,
    title: "Derivatives Practice",
    course: "MATH 202",
    questions: 8,
    duration: "12 min",
    recommended: false,
  },
  {
    id: 3,
    title: "Database Normalization",
    course: "CS 305",
    questions: 12,
    duration: "18 min",
    recommended: true,
  },
];

export function AvailableQuizzes() {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-primary-900">
          Available Quizzes
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          AI-generated from your recent notes
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {QUIZZES_DATA.map((quiz) => (
          <div
            key={quiz.id}
            className="flex items-center justify-between px-6 py-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {quiz.title}
                </h3>
                {quiz.recommended && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Recommended
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-medium text-primary-600">
                  {quiz.course}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {quiz.questions} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {quiz.duration}
                </span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
              <Play className="w-4 h-4" />
              Start
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
