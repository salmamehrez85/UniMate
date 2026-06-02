import { TrendingDown, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const MAX_VISIBLE_WEAK_AREAS = 5;

function WeakAreasList({ areas }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? areas : areas.slice(0, MAX_VISIBLE_WEAK_AREAS);
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {visible.map((area) => (
        <span
          key={area}
          className="text-xs text-red-700 bg-white border border-red-200 px-2 py-1 rounded-md">
          {area}
        </span>
      ))}
      {areas.length > MAX_VISIBLE_WEAK_AREAS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-red-600 underline underline-offset-2 px-1">
          {expanded
            ? "Show less"
            : `+${areas.length - MAX_VISIBLE_WEAK_AREAS} more`}
        </button>
      )}
    </div>
  );
}

export function RecentResults({ results, onDeleteResult }) {
  const { t } = useTranslation();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Disable body scroll when delete modal is open
  useEffect(() => {
    if (confirmDeleteId) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [confirmDeleteId]);

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-primary-900">
          {t("quizzes.results.title")}
        </h2>
      </div>

      {results.length === 0 && (
        <div className="px-6 py-10 text-sm text-gray-500">
          {t("quizzes.results.empty")}
        </div>
      )}

      {results.length > 0 && (
        <div className="divide-y divide-gray-100">
          {results.map((result) => (
            <div key={result.id} className="px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {result.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.course} • {result.date}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${result.score >= 85 ? "text-emerald-600" : result.score >= 70 ? "text-yellow-600" : "text-orange-600"}`}>
                      {result.score}/100
                    </p>
                    <p className="text-sm text-gray-500">{result.score}%</p>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteId(result.id)}
                    className="mt-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title={t("quizzes.results.deleteButton")}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {result.weakAreas.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-red-700 text-sm font-semibold">
                    <TrendingDown className="w-4 h-4" />
                    {t("quizzes.results.weakAreas")}
                  </div>
                  <WeakAreasList areas={result.weakAreas} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId &&
        createPortal(
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 overflow-hidden overflow-x-hidden">
            <div className="bg-white rounded-xl shadow-lg max-w-sm md:max-w-md w-full p-4 md:p-6 max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-primary-900 mb-2">
                {t("quizzes.results.deleteTitle")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("quizzes.results.deleteConfirmMessage")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onDeleteResult(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition cursor-pointer">
                  {t("quizzes.results.deleteConfirmYes")}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition cursor-pointer">
                  {t("quizzes.results.deleteConfirmNo")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
