import { createElement } from "react";
import {
  ClipboardList,
  GraduationCap,
  BookOpenCheck,
  CircleHelp,
  CheckSquare,
  GitBranch,
  Target,
} from "lucide-react";

const MODE_META = {
  quick: {
    label: "Quick",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-100",
    sections: [
      { key: "learningOutcomes", title: "Key Takeaways", Icon: GraduationCap },
      { key: "importantTerms", title: "Essential Terms", Icon: BookOpenCheck },
      { key: "actionItems", title: "Do Next", Icon: CheckSquare },
    ],
  },
  detailed: {
    label: "Detailed",
    badgeClass: "bg-primary-50 text-primary-700 border-primary-100",
    sections: [
      {
        key: "learningOutcomes",
        title: "What You Should Be Able To Do",
        Icon: GraduationCap,
      },
      {
        key: "conceptConnections",
        title: "How The Topics Connect",
        Icon: GitBranch,
      },
      { key: "importantTerms", title: "Important Terms", Icon: BookOpenCheck },
      { key: "studyPlan", title: "Study Plan", Icon: ClipboardList },
      {
        key: "possibleQuestions",
        title: "Possible Questions",
        Icon: CircleHelp,
      },
      { key: "actionItems", title: "Action Items", Icon: CheckSquare },
    ],
  },
  exam: {
    label: "Exam Focus",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
    sections: [
      { key: "examFocus", title: "Most Likely Exam Focus", Icon: Target },
      {
        key: "possibleQuestions",
        title: "Likely Exam Questions",
        Icon: CircleHelp,
      },
      {
        key: "learningOutcomes",
        title: "What You Must Know",
        Icon: GraduationCap,
      },
      {
        key: "importantTerms",
        title: "Terms To Memorize",
        Icon: BookOpenCheck,
      },
      { key: "studyPlan", title: "Revision Plan", Icon: ClipboardList },
      {
        key: "actionItems",
        title: "Immediate Revision Tasks",
        Icon: CheckSquare,
      },
    ],
  },
  action: {
    label: "Action Plan",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
    sections: [
      { key: "actionItems", title: "Priority Actions", Icon: CheckSquare },
      { key: "studyPlan", title: "Step-By-Step Plan", Icon: ClipboardList },
      {
        key: "learningOutcomes",
        title: "Target Outcomes",
        Icon: GraduationCap,
      },
      { key: "examFocus", title: "Weak Spots To Watch", Icon: Target },
      { key: "possibleQuestions", title: "Practice Prompts", Icon: CircleHelp },
    ],
  },
};

export function SummaryResult({ summaryData }) {
  if (!summaryData?.result) return null;

  const mode = summaryData.mode || "quick";
  const result = summaryData.result;
  const modeMeta = MODE_META[mode] || MODE_META.quick;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="text-lg font-bold text-primary-900">Summary</h3>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${modeMeta.badgeClass}`}>
            {modeMeta.label}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-6">{result.summary}</p>
      </div>

      {result.plainLanguageSummary && (
        <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
          <h4 className="text-sm font-semibold text-teal-800 mb-2">
            Why This Actually Matters
          </h4>
          <p className="text-sm text-teal-900 leading-6">
            {result.plainLanguageSummary}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {modeMeta.sections.map((section) => {
          const items = Array.isArray(result[section.key])
            ? result[section.key]
            : [];

          return (
            <div
              key={section.key}
              className="rounded-xl border border-gray-100 p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                {createElement(section.Icon, {
                  className: "w-4 h-4 text-primary-700",
                })}
                <h4 className="text-sm font-semibold text-primary-900">
                  {section.title}
                </h4>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-gray-500">No data available.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <li
                      key={`${section.key}-${index}`}
                      className="text-sm text-gray-700 leading-5">
                      • {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
