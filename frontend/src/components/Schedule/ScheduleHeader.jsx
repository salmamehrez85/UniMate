import { Calendar } from "lucide-react";

export function ScheduleHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <Calendar className="w-7 h-7 text-teal-500" />
        <h1 className="text-3xl font-bold text-primary-900">Weekly Schedule</h1>
      </div>
    </div>
  );
}
