import { BookOpen, CheckCircle, TrendingUp, Clock } from "lucide-react";

const STATS_CONFIG = [
  {
    key: "activeCourses",
    label: "Active Courses",
    Icon: BookOpen,
    color: "bg-blue-50 text-primary-600",
  },
  {
    key: "pendingTasks",
    label: "Pending Tasks",
    Icon: CheckCircle,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "avgPerformance",
    label: "Avg Performance",
    Icon: TrendingUp,
    color: "bg-purple-50 text-purple-700",
  },
  {
    key: "studyHours",
    label: "Completed Tasks",
    Icon: Clock,
    color: "bg-amber-50 text-amber-700",
  },
];

export function StatsCards({ stats = {}, loading = false }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {STATS_CONFIG.map((s) => (
        <div
          key={s.key}
          className="bg-white rounded-lg p-7 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 cursor-pointer">
          <div
            className={`w-14 h-14 rounded-lg ${s.color} flex items-center justify-center mb-5`}>
            <s.Icon className="w-7 h-7" />
          </div>
          <p className="text-3xl font-bold text-primary-900 mb-1">
            {loading ? "—" : (stats[s.key] ?? "—")}
          </p>
          <p className="text-xs text-gray-600 mt-2 font-semibold uppercase tracking-wide">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
