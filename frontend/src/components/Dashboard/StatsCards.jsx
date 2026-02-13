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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATS_DATA.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div
            className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
            <stat.Icon className="w-6 h-6" />
          </div>
          <p className="text-2xl font-bold text-primary-900">{stat.value}</p>
          <p className="text-sm text-gray-600 mt-1 font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
