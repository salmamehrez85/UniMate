import { useState } from "react";
import { CheckCircle, BookOpen, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OverviewTab({ course }) {
  const { t } = useTranslation();
  const [expandedSummaryKey, setExpandedSummaryKey] = useState(null);
  const [copiedSummaryKey, setCopiedSummaryKey] = useState(null);

  const upcomingTasksCount = (course.tasks || []).filter(
    (t) => t.status !== "done",
  ).length;

  const assessmentsCount = (course.assessments || []).length;

  const phasesCount = (course.phases || []).length;
  const savedSummaries = [...(course.savedSummaries || [])].sort(
    (a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0),
  );

  const formatSavedAt = (dateValue) => {
    if (!dateValue) return t("courseDetails.overview.unknownDate");
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime()))
      return t("courseDetails.overview.unknownDate");
    return date.toLocaleString();
  };

  const getSummaryPreview = (text) => {
    if (!text) return "";
    return text.length > 500 ? `${text.slice(0, 500)}...` : text;
  };

  const handleCopySummary = async (summaryKey, text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopiedSummaryKey(summaryKey);
      setTimeout(() => {
        setCopiedSummaryKey((prev) => (prev === summaryKey ? null : prev));
      }, 1200);
    } catch (error) {
      console.error("Failed to copy summary:", error);
    }
  };

  const stats = [
    {
      label: t("courseDetails.overview.upcomingTasks"),
      value: upcomingTasksCount,
      icon: Zap,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: t("courseDetails.overview.assessments"),
      value: assessmentsCount,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: t("courseDetails.overview.projectPhases"),
      value: phasesCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-bold text-primary-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-lg`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Info Block */}
      <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-primary-900 mb-6">
          {t("courseDetails.overview.courseInfo")}
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {t("courseDetails.overview.courseCode")}
            </p>
            <p className="text-lg font-semibold text-primary-900">
              {course.code}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {t("courseDetails.overview.courseName")}
            </p>
            <p className="text-lg font-semibold text-primary-900">
              {course.name || course.title}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {t("courseDetails.overview.instructor")}
            </p>
            <p className="text-lg font-semibold text-primary-900">
              {course.instructor || t("courseDetails.overview.notSpecified")}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {t("courseDetails.overview.schedule")}
            </p>
            <p className="text-lg font-semibold text-primary-900">
              {course.schedule || t("courseDetails.overview.notSpecified")}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {t("courseDetails.overview.credits")}
            </p>
            <p className="text-lg font-semibold text-primary-900">
              {course.credits || t("courseDetails.overview.na")}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              {t("courseDetails.overview.semester")}
            </p>
            <p className="text-lg font-semibold text-primary-900">
              {course.semester || t("courseDetails.overview.notSpecified")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-primary-900 mb-6">
          {t("courseDetails.overview.savedSummaries")}
        </h2>

        {savedSummaries.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t("courseDetails.overview.noSummaries")}
          </p>
        ) : (
          <div className="space-y-4">
            {savedSummaries.map((summary, index) =>
              (() => {
                const summaryKey = `${summary.savedAt || "summary"}-${index}`;
                const isExpanded = expandedSummaryKey === summaryKey;

                return (
                  <div
                    role="button"
                    tabIndex={0}
                    key={summaryKey}
                    onClick={() =>
                      setExpandedSummaryKey((prev) =>
                        prev === summaryKey ? null : summaryKey,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setExpandedSummaryKey((prev) =>
                          prev === summaryKey ? null : summaryKey,
                        );
                    }}
                    className="w-full text-left border border-gray-100 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-teal-100 text-teal-700 uppercase">
                        {summary.mode || "quick"}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {formatSavedAt(summary.savedAt)}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCopySummary(summaryKey, summary.text);
                          }}
                          className="text-xs font-medium text-teal-700 hover:text-teal-800 underline underline-offset-2">
                          {copiedSummaryKey === summaryKey
                            ? t("courseDetails.overview.copied")
                            : t("courseDetails.overview.copy")}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-6 whitespace-pre-wrap">
                      {isExpanded
                        ? summary.text || ""
                        : getSummaryPreview(summary.text)}
                    </p>
                    <p className="mt-2 text-xs text-teal-700 font-medium">
                      {isExpanded
                        ? "Click to collapse"
                        : "Click to read full summary"}
                    </p>
                  </div>
                );
              })(),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
