import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Download,
  BookMarked,
  FileQuestion,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  saveSummaryToCourse,
  updateCourse,
} from "../../services/courseService";

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

export function SummaryResult({ summaryData, courses = [] }) {
  const [copied, setCopied] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [saveMsg, setSaveMsg] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!saveOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSaveOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [saveOpen]);

  if (!summaryData?.result) return null;

  const mode = summaryData.mode || "quick";
  const language = summaryData.options?.language || "en";
  const isArabic = language === "ar";
  const result = summaryData.result;
  const config = MODE_CONFIG[mode] || MODE_CONFIG.quick;
  const overviewText = result.summary || result.plainLanguageSummary || "";
  const activeCourses = (courses || []).filter((c) => !c.isOldCourse);
  const textBlockClass = isArabic
    ? "text-base leading-8 text-right"
    : "text-sm leading-7";
  const paragraphBlockClass = isArabic
    ? "text-base leading-8 text-justify"
    : "text-sm leading-7";
  const textStyle = isArabic
    ? { fontFamily: "Cairo, Inter, sans-serif" }
    : undefined;

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

  const handleDownload = () => {
    const content = buildPlainText();
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`;
    const fileName = `unimate-summary-${mode}-${stamp}.txt`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveToCourse = async (course) => {
    setSaveOpen(false);
    setSaveStatus("saving");
    setSaveMsg("");
    const summaryText = buildPlainText();

    try {
      await saveSummaryToCourse(course._id, { mode, text: summaryText });
      setSaveStatus("saved");
      setSaveMsg(`Saved to ${course.code}`);
    } catch (err) {
      const message = err?.message || "Failed to save";

      if (message.includes("(404)")) {
        try {
          const nextSummaries = [
            ...(course.savedSummaries || []),
            { mode, text: summaryText, savedAt: new Date().toISOString() },
          ];

          await updateCourse(course._id, { savedSummaries: nextSummaries });
          setSaveStatus("saved");
          setSaveMsg(`Saved to ${course.code}`);
        } catch (fallbackErr) {
          setSaveStatus("error");
          setSaveMsg(fallbackErr?.message || "Failed to save");
        }
      } else {
        setSaveStatus("error");
        setSaveMsg(message);
      }
    } finally {
      setTimeout(() => {
        setSaveStatus(null);
        setSaveMsg("");
      }, 3000);
    }
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      lang={isArabic ? "ar" : "en"}
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Summary</h3>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      {/* Prose block */}
      <p className={`${paragraphBlockClass} text-gray-700`} style={textStyle}>
        <BoldedText text={overviewText} />
      </p>

      {/* Detailed mode extra paragraph */}
      {config.type === "prose-only" &&
        result.plainLanguageSummary &&
        result.plainLanguageSummary !== overviewText && (
          <p
            className={`${paragraphBlockClass} text-gray-600 mt-3`}
            style={textStyle}>
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
                          <p
                            className={`${textBlockClass} text-gray-700`}
                            style={textStyle}>
                            {item}
                          </p>
                        </div>
                      ) : (
                        <p
                          key={index}
                          className={`${textBlockClass} text-gray-700`}
                          style={textStyle}>
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
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Download
        </button>

        {/* Save to Course – inline course picker */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setSaveOpen((o) => !o)}
            disabled={saveStatus === "saving" || activeCourses.length === 0}
            title={
              activeCourses.length === 0
                ? "No active courses available"
                : "Save summary to a course"
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <BookMarked className="w-3.5 h-3.5" />
            {saveStatus === "saving" ? "Saving…" : "Save to Course"}
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {saveOpen && activeCourses.length > 0 && (
            <div className="absolute left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-50 py-1 overflow-hidden">
              <p className="px-3 py-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide border-b border-gray-100">
                Choose a course
              </p>
              {activeCourses.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => handleSaveToCourse(c)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 transition-colors">
                  <span className="font-semibold">{c.code}</span>
                  <span className="ml-1 text-gray-500 truncate">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save status toast */}
        {saveStatus === "saved" && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> {saveMsg}
          </span>
        )}
        {saveStatus === "error" && (
          <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <XCircle className="w-3.5 h-3.5" /> {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
}
