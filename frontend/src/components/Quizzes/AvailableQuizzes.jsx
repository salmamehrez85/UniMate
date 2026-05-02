import { BookOpen, Clock, LoaderCircle, Play, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const formatCourseLabel = (course) => `${course.code} - ${course.name}`;

export function AvailableQuizzes({
  courses,
  quizzes,
  loading,
  error,
  selectedCourseId,
  targetTopics,
  onSelectCourse,
  onStartQuiz,
}) {
  const { t } = useTranslation();
  const selectedCourse = courses.find(
    (course) => course._id === selectedCourseId,
  );

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary-900">
              {t("quizzes.available.title")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t("quizzes.available.subtitle")}
            </p>
          </div>
          <div className="w-full md:w-80">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("quizzes.available.courseLabel")}
            </label>
            <select
              value={selectedCourseId}
              onChange={(event) => onSelectCourse(event.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition">
              {courses.length === 0 && (
                <option value="">
                  {t("quizzes.available.noCoursesFound")}
                </option>
              )}
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {formatCourseLabel(course)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {targetTopics.length > 0 && (
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
          <p className="text-sm font-semibold text-amber-900">
            Current Study Targets for{" "}
            {selectedCourse ? selectedCourse.code : "this course"}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {targetTopics.map((topic) => (
              <span
                key={topic.tag}
                className="text-xs text-amber-800 bg-white border border-amber-200 px-2 py-1 rounded-md">
                {topic.tag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="px-6 py-10 flex items-center justify-center gap-3 text-gray-500">
          <LoaderCircle className="w-5 h-5 animate-spin" />
          {t("quizzes.available.loading")}
        </div>
      )}

      {!loading && error && (
        <div className="px-6 py-6 text-sm text-red-700 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      {!loading && !error && quizzes.length === 0 && (
        <div className="px-6 py-10 text-sm text-gray-500">
          {t("quizzes.available.empty")}
        </div>
      )}

      {!loading && !error && quizzes.length > 0 && (
        <div className="divide-y divide-gray-100">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {quiz.title}
                  </h3>
                  {quiz.isRecommended && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      {t("quizzes.available.recommended")}
                    </span>
                  )}
                </div>
                {quiz.recommendationReason && (
                  <p className="text-sm text-gray-500 mb-2">
                    {quiz.recommendationReason}
                  </p>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium text-primary-600">
                    {selectedCourse
                      ? formatCourseLabel(selectedCourse)
                      : "Selected course"}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {quiz.totalQuestions} {t("quizzes.available.questions")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.estimatedDurationMinutes} {t("quizzes.available.min")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onStartQuiz(quiz)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
                <Play className="w-4 h-4" />
                {t("quizzes.available.startButton")}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
