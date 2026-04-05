import { Info } from "lucide-react";

export function EmptySchedule() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
      <div className="flex justify-center mb-4">
        <Info className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        No schedule data yet
      </h3>
      <p className="text-sm text-gray-400 max-w-xs mx-auto">
        Add a schedule to your courses (e.g. "Mon/Wed 10:00-11:30") and it will
        appear here automatically.
      </p>
    </div>
  );
}
