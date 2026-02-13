import { Plus, FileText, HelpCircle } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-4 pt-2 justify-center">
      <button
        className="flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
        style={{ backgroundColor: "#398FAC" }}>
        <Plus className="w-5 h-5" />
        Add Task
      </button>
      <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md border border-gray-200">
        <FileText className="w-5 h-5" />
        Summarize
      </button>
      <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md border border-gray-200">
        <HelpCircle className="w-5 h-5" />
        Take Quiz
      </button>
    </div>
  );
}
