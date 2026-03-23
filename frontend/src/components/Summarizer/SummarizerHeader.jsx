import { FileText } from "lucide-react";

export function SummarizerHeader() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary-900 tracking-tight">
            AI Summarizer
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Turn outlines and notes into structured study summaries.
          </p>
        </div>
      </div>
    </div>
  );
}
