import {
  CheckCircle,
  XCircle,
  X,
  Trophy,
  Target,
  AlertTriangle,
} from "lucide-react";

/**
 * Displays a full answer review after quiz submission.
 *
 * Props:
 *  - quiz        : original quiz object (with questions + options)
 *  - quizResult  : submission response.quizResult (answeredQuestions, score, etc.)
 *  - weakAreas   : string[] of weak topic tags
 *  - onClose     : () => void
 */
export function QuizReviewModal({ quiz, quizResult, weakAreas = [], onClose }) {
  if (!quiz || !quizResult) return null;

  const {
    correctAnswers,
    totalQuestions,
    score,
    answeredQuestions = [],
  } = quizResult;

  // Build a lookup from questionId → original question (for options text)
  const questionMap = Object.fromEntries(
    (quiz.questions || []).map((q) => [q.questionId, q]),
  );

  const pct = typeof score === "number" ? Math.round(score) : 0;
  const scoreColor =
    pct >= 80
      ? "text-green-600"
      : pct >= 60
        ? "text-amber-600"
        : "text-red-600";
  const scoreBg =
    pct >= 80 ? "bg-green-50" : pct >= 60 ? "bg-amber-50" : "bg-red-50";
  const scoreBorder =
    pct >= 80
      ? "border-green-200"
      : pct >= 60
        ? "border-amber-200"
        : "border-red-200";

  // Resolve option text from a key (for MCQ / multiple_select / true_false)
  const resolveOptionText = (question, key) => {
    if (question?.type === "true_false") {
      return key === true || key === "true" ? "True" : "False";
    }
    if (!question?.options) return String(key);
    const opt = question.options.find(
      (o) => String(o.key) === String(key) || o.key === key,
    );
    return opt ? opt.text : String(key);
  };

  const renderAnswer = (question, answerKey) => {
    if (answerKey === null || answerKey === undefined || answerKey === "") {
      return <span className="italic text-gray-400">No answer given</span>;
    }
    if (Array.isArray(answerKey)) {
      if (answerKey.length === 0)
        return <span className="italic text-gray-400">No answer given</span>;
      return answerKey.map((k) => resolveOptionText(question, k)).join(", ");
    }
    return resolveOptionText(question, answerKey);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quiz Review</h2>
            <p className="text-sm text-gray-500 mt-0.5">{quiz.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Score summary */}
        <div
          className={`mx-6 mt-5 rounded-xl border ${scoreBorder} ${scoreBg} px-5 py-4 flex flex-wrap items-center gap-6`}>
          <div className="flex items-center gap-3">
            <Trophy className={`w-8 h-8 ${scoreColor}`} />
            <div>
              <p className={`text-3xl font-bold ${scoreColor}`}>{pct}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Overall score</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{correctAnswers} correct</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{totalQuestions - correctAnswers} incorrect</span>
          </div>
          {weakAreas.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-600 flex-1 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>
                <span className="font-medium text-amber-700">Weak areas: </span>
                {weakAreas.slice(0, 4).join(", ")}
                {weakAreas.length > 4 && ` +${weakAreas.length - 4} more`}
              </span>
            </div>
          )}
        </div>

        {/* Question review list */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {answeredQuestions.map((aq, index) => {
            const original = questionMap[aq.questionId];
            const correct = aq.isCorrect;

            return (
              <div
                key={aq.questionId || index}
                className={`rounded-xl border p-5 ${
                  correct
                    ? "border-green-200 bg-green-50/40"
                    : "border-red-200 bg-red-50/40"
                }`}>
                {/* Question header */}
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    {correct ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                      Question {index + 1}
                      {original?.difficulty && ` • ${original.difficulty}`}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      {aq.prompt}
                    </p>
                  </div>
                </div>

                {/* Answer comparison */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 ms-8">
                  {/* User's answer */}
                  <div
                    className={`rounded-lg px-4 py-3 border ${
                      correct
                        ? "bg-green-100 border-green-200"
                        : "bg-red-100 border-red-200"
                    }`}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Your answer
                    </p>
                    <p
                      className={`text-sm font-medium ${correct ? "text-green-800" : "text-red-700"}`}>
                      {renderAnswer(original, aq.selectedAnswer)}
                    </p>
                  </div>

                  {/* Correct answer (always shown) */}
                  <div className="rounded-lg px-4 py-3 border bg-white border-green-300">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Correct answer
                    </p>
                    <p className="text-sm font-medium text-green-800">
                      {renderAnswer(original, aq.correctAnswer)}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {Array.isArray(aq.subTopicTags) &&
                  aq.subTopicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 ms-8">
                      {aq.subTopicTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md">
                          {tag.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
