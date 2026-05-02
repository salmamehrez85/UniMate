import { useEffect, useState } from "react";
import {
  Brain,
  Trophy,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap,
} from "lucide-react";
import { getQuizResultsByCourse } from "../../services/quizService";
import { useTranslation } from "react-i18next";

// ── helpers ────────────────────────────────────────────────────────────────

const formatDate = (value, unknownLabel = "Unknown") => {
  if (!value) return unknownLabel;
  const d = new Date(value);
  return isNaN(d.getTime())
    ? unknownLabel
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const scoreColor = (score) => {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
};

const scoreBg = (score) => {
  if (score >= 85) return "bg-emerald-50 border-emerald-200";
  if (score >= 70) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
};

const difficultyBadge = (d) => {
  const map = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
    mixed: "bg-purple-100 text-purple-700",
  };
  return map[d] || "bg-gray-100 text-gray-600";
};

// Rule-based recommendation for a weak area topic
const topicRecommendation = (topic) => {
  const t = topic.toLowerCase();
  if (t.includes("definition") || t.includes("concept"))
    return "Review the core definitions and build conceptual clarity before moving to applications.";
  if (
    t.includes("formula") ||
    t.includes("equation") ||
    t.includes("calculation")
  )
    return "Practice derivation steps and apply the formula in varied example problems.";
  if (t.includes("algorithm") || t.includes("procedure") || t.includes("step"))
    return "Trace through the algorithm step-by-step on paper with multiple inputs.";
  if (t.includes("comparison") || t.includes("difference") || t.includes("vs"))
    return "Create a comparison table listing similarities and differences side by side.";
  if (t.includes("application") || t.includes("example") || t.includes("case"))
    return "Seek real-world examples and try solving applied problems from past exams.";
  return `Review course material on '${topic}' and attempt 2–3 practice questions targeting this area.`;
};

// ── sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color = "text-teal-600",
  bg = "bg-teal-50",
}) {
  const I = icon;
  return (
    <div
      className={`${bg} rounded-xl p-4 border border-opacity-40 flex items-center gap-3`}>
      <div className={`${color} p-2 rounded-lg bg-white shadow-sm`}>
        <I className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function ScoreTrendBar({ results }) {
  const { t } = useTranslation();
  if (!results || results.length < 2) return null;

  // Take last 6 attempts, oldest first
  const slice = [...results].reverse().slice(-6);
  const max = 100;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-teal-600" />
        {t("courseDetails.aiPractice.scoreTrend", { count: slice.length })}
      </h3>
      <div className="flex items-end gap-2 h-20">
        {slice.map((r, i) => {
          const height = Math.max(8, (r.score / max) * 80);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className={`text-xs font-bold ${scoreColor(r.score)}`}>
                {r.score}%
              </span>
              <div
                className={`w-full rounded-t-md transition-all ${
                  r.score >= 85
                    ? "bg-emerald-400"
                    : r.score >= 70
                      ? "bg-amber-400"
                      : "bg-red-400"
                }`}
                style={{ height: `${height}px` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeakAreasPanel({ weakAreas }) {
  const { t } = useTranslation();
  if (!weakAreas || weakAreas.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="font-semibold text-emerald-800">
          {t("courseDetails.aiPractice.noWeakAreas")}
        </p>
        <p className="text-sm text-emerald-600 mt-1">
          {t("courseDetails.aiPractice.keepTakingQuizzes")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weakAreas.map(({ topic, count }, idx) => (
        <div
          key={idx}
          className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <span className="font-semibold text-gray-800 text-sm">
                {topic}
              </span>
            </div>
            <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              {t("courseDetails.aiPractice.missed", { count })}
            </span>
          </div>
          <div className="flex items-start gap-2 mt-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600">
              {topicRecommendation(topic)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ result }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border ${scoreBg(result.score)} transition-all`}>
      {/* Summary row */}
      <button
        className="w-full text-left p-4 flex items-center justify-between"
        onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`text-2xl font-bold ${scoreColor(result.score)} w-14 shrink-0`}>
            {result.score}%
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {result.quizTitle}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyBadge(result.difficulty)}`}>
                {result.difficulty}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {result.correctAnswers}/{result.totalQuestions} correct
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(
                  result.completedAt,
                  t("courseDetails.aiPractice.unknown"),
                )}
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
          {result.weakAreas && result.weakAreas.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t("courseDetails.aiPractice.weakAreasInAttempt")}
              </p>
              <div className="flex flex-wrap gap-2">
                {result.weakAreas.map((area, i) => (
                  <span
                    key={i}
                    className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                    {area}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />{" "}
              {t("courseDetails.aiPractice.noWeakAreasInAttempt")}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Attempt #{result.attemptNumber} · Source: {result.submissionSource}
          </p>
        </div>
      )}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function AIPracticeTab({ course }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!course?._id) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await getQuizResultsByCourse(course._id);
        setData(res);
      } catch (err) {
        setError(err.message || "Failed to load quiz results");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [course?._id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="font-semibold text-red-800">
          {t("courseDetails.aiPractice.loadError")}
        </p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  const { stats, results, aggregatedWeakAreas } = data || {};
  const hasResults = results && results.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-teal-100 p-2 rounded-xl">
          <Brain className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t("courseDetails.aiPractice.title")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("courseDetails.aiPractice.subtitle")}{" "}
            <span className="font-medium">{course?.name}</span>
          </p>
        </div>
      </div>

      {!hasResults ? (
        /* empty state */
        <div className="bg-linear-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-10 text-center">
          <Zap className="w-12 h-12 text-teal-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-teal-800 mb-2">
            {t("courseDetails.aiPractice.noQuizzesYet")}
          </h3>
          <p className="text-sm text-teal-600 max-w-sm mx-auto">
            {t("courseDetails.aiPractice.emptyMessage")}
          </p>
        </div>
      ) : (
        <>
          {/* ── Stats overview ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={BarChart2}
              label={t("courseDetails.aiPractice.totalAttempts")}
              value={stats.totalAttempts}
              color="text-teal-600"
              bg="bg-teal-50"
            />
            <StatCard
              icon={TrendingUp}
              label={t("courseDetails.aiPractice.avgScore")}
              value={`${stats.avgScore}%`}
              color={stats.avgScore >= 70 ? "text-emerald-600" : "text-red-600"}
              bg={stats.avgScore >= 70 ? "bg-emerald-50" : "bg-red-50"}
            />
            <StatCard
              icon={Trophy}
              label={t("courseDetails.aiPractice.bestScore")}
              value={`${stats.bestScore}%`}
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <StatCard
              icon={Target}
              label={t("courseDetails.aiPractice.latestScore")}
              value={stats.latestScore !== null ? `${stats.latestScore}%` : "—"}
              color={
                stats.latestScore >= 70 ? "text-emerald-600" : "text-red-600"
              }
              bg={stats.latestScore >= 70 ? "bg-emerald-50" : "bg-red-50"}
            />
          </div>

          {/* ── Score trend ── */}
          <ScoreTrendBar results={results} />

          {/* ── Weak areas + recommendations ── */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              {t("courseDetails.aiPractice.needsPractice")}
              {aggregatedWeakAreas?.length > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {aggregatedWeakAreas.length} topic
                  {aggregatedWeakAreas.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>
            <WeakAreasPanel weakAreas={aggregatedWeakAreas} />
          </div>

          {/* ── Quiz Results history ── */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              {t("courseDetails.aiPractice.quizHistory")}
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {results.length}
              </span>
            </h3>
            <div className="space-y-3">
              {results.map((r) => (
                <ResultCard key={r._id} result={r} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
