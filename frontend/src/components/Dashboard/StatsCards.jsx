import { BookOpen, CheckCircle, TrendingUp, Clock } from "lucide-react";

const STATS_DATA = [
  {
    label: "Active Courses",
    value: "4",
    Icon: BookOpen,
    color: "bg-blue-50 text-primary-600",
  },
  {
    label: "Pending Tasks",
    value: "12",
    Icon: CheckCircle,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Avg Performance",
    value: "85%",
    Icon: TrendingUp,
    color: "bg-purple-50 text-purple-700",
  },
  {
    label: "Study Hours",
    value: "32h",
    Icon: Clock,
    color: "bg-amber-50 text-amber-700",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {STATS_DATA.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-7 shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 cursor-pointer">
          <div
            className={`w-14 h-14 rounded-lg ${stat.color} flex items-center justify-center mb-5`}>
            <stat.Icon className="w-7 h-7" />
          </div>
          <p className="text-3xl font-bold text-primary-900 mb-1">
            {stat.value}
          </p>
          <p className="text-xs text-gray-600 mt-2 font-semibold uppercase tracking-wide">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
