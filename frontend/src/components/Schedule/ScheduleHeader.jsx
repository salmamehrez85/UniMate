import { Calendar } from "lucide-react";

export function ScheduleHeader() {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 4); // Friday

  const fmt = (d) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <Calendar className="w-7 h-7 text-teal-500" />
        <h1 className="text-3xl font-bold text-primary-900">Weekly Schedule</h1>
      </div>
      <p className="text-gray-500 text-sm ml-10">
        {fmt(weekStart)} – {fmt(weekEnd)}, {today.getFullYear()}
      </p>
    </div>
  );
}
