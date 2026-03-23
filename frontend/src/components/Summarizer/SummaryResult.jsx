import { useState } from "react";
import { Copy, Check, BookMarked, FileQuestion } from "lucide-react";

const MODE_CONFIG = {
  quick: {
    label: "Quick",
    badgeClass: "bg-sky-500 text-white",
    accentClass: "text-sky-700",
    dividerClass: "border-sky-100",
    type: "prose",
    sections: [
      { key: "learningOutcomes", title: "Key Takeaways" },
      { key: "actionItems", title: "What To Do Next" },
    ],
  },
  detailed: {
    label: "Detailed",
    badgeClass: "bg-violet-600 text-white",
    accentClass: "text-violet-700",
    dividerClass: "border-violet-100",
    type: "prose-only",
    sections: [],
  },
  exam: {
    label: "Exam Focus",
    badgeClass: "bg-amber-500 text-white",
    accentClass: "text-amber-600",
    dividerClass: "border-amber-100",
    type: "prose",
    sections: [
      { key: "examFocus", title: "Most Likely Exam Focus" },
      { key: "learningOutcomes", title: "What You Must Know" },
      {
        key: "possibleQuestions",
        title: "Likely Exam Questions",
        numbered: true,
      },
      { key: "studyPlan", title: "Revision Plan" },
    ],
  },
};

// Highlight capitalized phrases and abbreviations within a paragraph
function BoldedText({ text }) {
  if (!text) return null;
  const pattern =
    /\b([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,}){1,4}|[A-Z]{2,}(?:\/[A-Z]+)?)\b/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <strong key={match.index} className="font-semibold text-gray-900">
        {match[0]}
      </strong>,
    );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

export function SummaryResult({ summaryData, onNavigate }) {
  const [copied, setCopied] = useState(false);

  if (!summaryData?.result) return null;

  const mode = summaryData.mode || "quick";
  const result = summaryData.result;
  const config = MODE_CONFIG[mode] || MODE_CONFIG.quick;
  const overviewText = result.summary || result.plainLanguageSummary || "";

  // Build plain text version for copy / quiz
  const buildPlainText = () => {
    const lines = [overviewText];
    config.sections.forEach((section) => {
      const items = Array.isArray(result[section.key])
        ? result[section.key].filter(Boolean)
        : [];
      if (items.length > 0) {
        lines.push(`\n${section.title.toUpperCase()}`);
        items.forEach((item, i) =>
          lines.push(section.numbered ? `Q${i + 1}. ${item}` : `• ${item}`),
        );
      }
    });
    return lines.join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildPlainText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleStartQuiz = () => {
    if (onNavigate) onNavigate("quizzes");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Summary</h3>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      {/* Prose block */}
      <p className="text-sm text-gray-700 leading-7">
        <BoldedText text={overviewText} />
      </p>

      {/* Detailed mode extra paragraph */}
      {config.type === "prose-only" &&
        result.plainLanguageSummary &&
        result.plainLanguageSummary !== overviewText && (
          <p className="text-sm text-gray-600 leading-7 mt-3">
            <BoldedText text={result.plainLanguageSummary} />
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
                  <h4
                    className={`text-xs font-bold uppercase tracking-widest mb-3 ${config.accentClass}`}>
                    {section.title}
                  </h4>
                  <div className={section.numbered ? "space-y-4" : "space-y-2"}>
                    {items.map((item, index) =>
                      section.numbered ? (
                        <div key={index} className="flex gap-3 items-start">
                          <span
                            className={`text-xs font-bold shrink-0 mt-0.5 ${config.accentClass}`}>
                            Q{index + 1}.
                          </span>
                          <p className="text-sm text-gray-700 leading-6">
                            {item}
                          </p>
                        </div>
                      ) : (
                        <p
                          key={index}
                          className="text-sm text-gray-700 leading-6">
                          <BoldedText text={item} />
                        </p>
                      ),
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Action buttons */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors">
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed">
          <BookMarked className="w-3.5 h-3.5" />
          Save to Course
        </button>
        <button
          type="button"
          onClick={handleStartQuiz}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors">
          <FileQuestion className="w-3.5 h-3.5" />
          Start Quiz
        </button>
      </div>
    </div>
  );
}
