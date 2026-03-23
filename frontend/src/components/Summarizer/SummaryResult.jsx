import { createElement } from "react";
import {
  ClipboardList,
  Lightbulb,
  BookOpenCheck,
  CircleHelp,
  CheckSquare,
} from "lucide-react";

const SECTION_CONFIG = [
  { key: "keyPoints", title: "Key Points", Icon: Lightbulb },
  { key: "importantTerms", title: "Important Terms", Icon: BookOpenCheck },
  { key: "studyPlan", title: "Study Plan", Icon: ClipboardList },
  { key: "possibleQuestions", title: "Possible Questions", Icon: CircleHelp },
  { key: "actionItems", title: "Action Items", Icon: CheckSquare },
];

export function SummaryResult({ result }) {
  if (!result) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-primary-900 mb-2">Summary</h3>
        <p className="text-sm text-gray-700 leading-6">{result.summary}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {SECTION_CONFIG.map((section) => {
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
