const MODE_CONFIG = {
  quick: {
    label: "Quick",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-100",
    accentClass: "text-sky-700",
    dividerClass: "border-sky-100",
    // prose: render summary as a short readable paragraph, then key takeaways
    type: "prose",
    sections: [
      { key: "learningOutcomes", title: "Key Takeaways" },
      { key: "actionItems", title: "What To Do Next" },
    ],
  },
  detailed: {
    label: "Detailed",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-100",
    accentClass: "text-violet-700",
    dividerClass: "border-violet-100",
    // prose-only: just one flowing detailed text, no list sections
    type: "prose-only",
    sections: [],
  },
  exam: {
    label: "Exam Focus",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
    accentClass: "text-amber-600",
    dividerClass: "border-amber-100",
    type: "prose",
    sections: [
      { key: "examFocus", title: "Most Likely Exam Focus" },
      { key: "learningOutcomes", title: "What You Must Know" },
      { key: "possibleQuestions", title: "Likely Exam Questions" },
      { key: "studyPlan", title: "Revision Plan" },
    ],
  },
};

export function SummaryResult({ summaryData }) {
  if (!summaryData?.result) return null;

  const mode = summaryData.mode || "quick";
  const result = summaryData.result;
  const config = MODE_CONFIG[mode] || MODE_CONFIG.quick;

  const overviewText = result.summary || result.plainLanguageSummary || "";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Summary</h3>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      {/* Prose block — shown for all modes */}
      <p className="text-sm text-gray-700 leading-7">
        {overviewText}
      </p>

      {/* Detailed mode: prose only, no sections */}
      {config.type === "prose-only" && result.plainLanguageSummary && result.plainLanguageSummary !== overviewText && (
        <p className="text-sm text-gray-600 leading-7 mt-3">
          {result.plainLanguageSummary}
        </p>
      )}

      {/* Section list (quick & exam modes) */}
      {config.sections.length > 0 && (
        <>
          <hr className={`border-t ${config.dividerClass} my-5`} />
          <div className="space-y-5">
            {config.sections.map((section) => {
              const items = Array.isArray(result[section.key])
                ? result[section.key].filter(Boolean)
                : [];

              if (items.length === 0) return null;

              return (
                <div key={section.key}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest mb-2 ${config.accentClass}`}>
                    {section.title}
                  </h4>
                  <div className="space-y-1.5">
                    {items.map((item, index) => (
                      <p key={index} className="text-sm text-gray-700 leading-6">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
