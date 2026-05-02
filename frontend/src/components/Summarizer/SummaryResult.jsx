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
import { useTranslation } from "react-i18next";

// Highlight capitalized phrases and abbreviations within a single line
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

// Render summary text with smart structure:
// • Short keyword phrases → horizontal pill tags (scannable)
// • Medium section-label phrases → bold subheadings
// • Full sentences → readable paragraphs
function FormattedSummary({ text, paragraphClass, textStyle, isArabic }) {
  if (!text) return null;

  // Step 1: break on newlines AND inline bullet separators (•, ▪, ■, ◆)
  const segments = text
    .split(/\n+/)
    .flatMap((line) => line.split(/\s*[•▪■◆]\s+/))
    .map((s) => s.replace(/^[-–]\s*/, "").trim())
    .filter((s) => s.length > 2);

  // Step 2: classify each segment
  const classify = (seg) => {
    const wc = seg.trim().split(/\s+/).length;
    const hasPunct = /[.!?؟]$/.test(seg);
    const isLong = seg.length > 55;
    // Full sentences → paragraph
    if (isLong || hasPunct) return "sentence";
    // Short keyword / label (≤ 6 words, no period) → tag
    if (wc <= 6) return "tag";
    return "sentence";
  };

  // Step 3: group adjacent tags together; keep sentences separate
  const blocks = [];
  let tagBuf = [];

  const flushTags = () => {
    if (tagBuf.length > 0) {
      blocks.push({ type: "tags", items: [...tagBuf] });
      tagBuf = [];
    }
  };

  segments.forEach((seg) => {
    if (classify(seg) === "tag") {
      tagBuf.push(seg);
    } else {
      flushTags();
      blocks.push({ type: "sentence", text: seg });
    }
  });
  flushTags();

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) =>
        block.type === "tags" ? (
          // Render short keyword items as horizontal pill chips
          <div
            key={i}
            className={`flex flex-wrap gap-1.5 my-1 ${isArabic ? "flex-row-reverse" : ""}`}>
            {block.items.map((item, j) => (
              <span
                key={j}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                style={textStyle}>
                {item}
              </span>
            ))}
          </div>
        ) : (
          // Render full sentences as clean readable paragraphs
          <p
            key={i}
            className={`${paragraphClass} text-gray-700`}
            style={textStyle}>
            <BoldedText text={block.text} />
          </p>
        ),
      )}
    </div>
  );
}

export function SummaryResult({ summaryData, courses = [] }) {
  const { t } = useTranslation();

  const MODE_CONFIG = {
    quick: {
      label: t("summarizer.modes.quick"),
      badgeClass: "bg-sky-500 text-white",
      accentClass: "text-sky-700",
      dividerClass: "border-sky-100",
      type: "prose",
      sections: [
        { key: "learningOutcomes", title: t("summarizer.result.keyTakeaways") },
        { key: "actionItems", title: t("summarizer.result.whatToDoNext") },
      ],
    },
    detailed: {
      label: t("summarizer.modes.detailed"),
      badgeClass: "bg-violet-600 text-white",
      accentClass: "text-violet-700",
      dividerClass: "border-violet-100",
      type: "prose",
      sections: [
        { key: "learningOutcomes", title: t("summarizer.result.learningOutcomes") },
        { key: "conceptConnections", title: t("summarizer.result.conceptConnections") },
        { key: "importantTerms", title: t("summarizer.result.keyTerms") },
        { key: "studyPlan", title: t("summarizer.result.studyPlan"), numbered: true },
        { key: "possibleQuestions", title: t("summarizer.result.possibleQuestions"), numbered: true },
      ],
    },
    exam: {
      label: t("summarizer.modes.exam"),
      badgeClass: "bg-amber-500 text-white",
      accentClass: "text-amber-600",
      dividerClass: "border-amber-100",
      type: "prose",
      sections: [
        { key: "examFocus", title: t("summarizer.result.examTopics") },
        { key: "importantTerms", title: t("summarizer.result.mustKnowTerms") },
        { key: "possibleQuestions", title: t("summarizer.result.examQuestions"), numbered: true },
        { key: "studyPlan", title: t("summarizer.result.revisionPlan"), numbered: true },
      ],
    },
    custom: {
      label: t("summarizer.modes.custom"),
      badgeClass: "bg-teal-600 text-white",
      accentClass: "text-teal-700",
      dividerClass: "border-teal-100",
      type: "prose",
      sections: [
        { key: "learningOutcomes", title: t("summarizer.result.learningOutcomes") },
        { key: "conceptConnections", title: t("summarizer.result.conceptConnections") },
        { key: "examFocus", title: t("summarizer.result.examFocus") },
        { key: "importantTerms", title: t("summarizer.result.keyTermsShort") },
        { key: "studyPlan", title: t("summarizer.result.studyPlan"), numbered: true },
        { key: "possibleQuestions", title: t("summarizer.result.possibleQuestions"), numbered: true },
        { key: "actionItems", title: t("summarizer.result.actionItems") },
      ],
    },
  };

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
        <h3 className="text-lg font-bold text-gray-900">{t("summarizer.result.title")}</h3>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      {/* Prose block */}
      <FormattedSummary
        text={overviewText}
        paragraphClass={paragraphBlockClass}
        textStyle={textStyle}
        isArabic={isArabic}
      />

      {/* Detailed mode: also show plainLanguageSummary as a second paragraph */}
      {mode === "detailed" &&
        result.plainLanguageSummary &&
        result.plainLanguageSummary !== overviewText && (
          <div className="mt-3">
            <FormattedSummary
              text={result.plainLanguageSummary}
              paragraphClass={paragraphBlockClass}
              textStyle={textStyle}
              isArabic={isArabic}
            />
          </div>
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
          {copied ? t("summarizer.result.copied") : t("summarizer.result.copy")}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors">
          <Download className="w-3.5 h-3.5" />
          {t("summarizer.result.download")}
        </button>

        {/* Save to Course – inline course picker */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setSaveOpen((o) => !o)}
            disabled={saveStatus === "saving" || activeCourses.length === 0}
            title={
              activeCourses.length === 0
                ? t("summarizer.result.noCoursesTitle")
                : t("summarizer.result.saveToCourseTitle")
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <BookMarked className="w-3.5 h-3.5" />
            {saveStatus === "saving" ? t("summarizer.result.saving") : t("summarizer.result.saveToCourse")}
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {saveOpen && activeCourses.length > 0 && (
            <div className="absolute left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-50 py-1 overflow-hidden">
              <p className="px-3 py-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide border-b border-gray-100">
                {t("summarizer.result.chooseCourse")}
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
