import { LoaderCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const createInitialAnswers = (quiz) => {
  if (!quiz || !Array.isArray(quiz.questions)) {
    return {};
  }

  return quiz.questions.reduce((answers, question) => {
    answers[question.questionId] =
      question.type === "multiple_select" ? [] : "";
    return answers;
  }, {});
};

const toggleMultipleSelectAnswer = (currentAnswers, optionKey) => {
  return currentAnswers.includes(optionKey)
    ? currentAnswers.filter((value) => value !== optionKey)
    : [...currentAnswers, optionKey];
};

export function QuizSessionModal({
  quiz,
  course,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState(createInitialAnswers(quiz));

  useEffect(() => {
    setAnswers(createInitialAnswers(quiz));
  }, [quiz]);

  if (!quiz) {
    return null;
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    await onSubmit(quiz._id, userAnswers);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {course
                ? `${course.code} - ${course.name}`
                : t("quizzes.session.practiceQuiz")}{" "}
              • {quiz.totalQuestions}{" "}
              {t("quizzes.session.questions_other").replace("{{count}} ", "")} •{" "}
              {quiz.estimatedDurationMinutes} {t("quizzes.available.min")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={isSubmitting}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {quiz.questions.map((question, index) => (
            <div
              key={question.questionId}
              className="border border-gray-200 rounded-xl p-5 bg-gray-50/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                    Question {index + 1} • {question.difficulty}
                  </p>
                  <h3 className="text-base font-semibold text-gray-900 mt-2">
                    {question.prompt}
                  </h3>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {question.estimatedSeconds}s
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {(question.type === "mcq" || question.type === "true_false") &&
                  (question.type === "true_false"
                    ? [
                        { key: true, text: t("quizzes.session.true") },
                        { key: false, text: t("quizzes.session.false") },
                      ]
                    : question.options
                  ).map((option) => (
                    <label
                      key={String(option.key)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
                      <input
                        type="radio"
                        name={question.questionId}
                        checked={answers[question.questionId] === option.key}
                        onChange={() =>
                          handleAnswerChange(question.questionId, option.key)
                        }
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">
                        {option.text}
                      </span>
                    </label>
                  ))}

                {question.type === "multiple_select" &&
                  question.options.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(answers[question.questionId] || []).includes(
                          option.key,
                        )}
                        onChange={() =>
                          handleAnswerChange(
                            question.questionId,
                            toggleMultipleSelectAnswer(
                              answers[question.questionId] || [],
                              option.key,
                            ),
                          )
                        }
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">
                        {option.text}
                      </span>
                    </label>
                  ))}

                {question.type === "short_answer" && (
                  <textarea
                    rows="3"
                    value={answers[question.questionId] || ""}
                    onChange={(event) =>
                      handleAnswerChange(
                        question.questionId,
                        event.target.value,
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none bg-white"
                    placeholder={t("quizzes.session.answerPlaceholder")}
                  />
                )}
              </div>

              {Array.isArray(question.subTopicTags) &&
                question.subTopicTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {question.subTopicTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-md">
                        {tag.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          ))}

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {submitError}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {t("quizzes.session.submitMessage")}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={isSubmitting}>
              {t("common.close")}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  {t("quizzes.session.submitting")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t("quizzes.session.submit")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
