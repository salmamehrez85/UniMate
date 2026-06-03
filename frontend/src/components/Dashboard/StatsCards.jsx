import { BookOpen, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export function StatsCards({ stats = {}, loading = false }) {
  const { t } = useTranslation();

  const STATS_CONFIG = [
    {
      key: "activeCourses",
      label: t("dashboard.stats.activeCourses"),
      Icon: BookOpen,
      color: "bg-blue-50 text-primary-600",
    },
    {
      key: "pendingTasks",
      label: t("dashboard.stats.pendingTasks"),
      Icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      key: "avgPerformance",
      label: t("dashboard.stats.avgPerformance"),
      Icon: TrendingUp,
      color: "bg-purple-50 text-purple-700",
    },
    {
      key: "studyHours",
      label: t("dashboard.stats.completedTasks"),
      Icon: Clock,
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {STATS_CONFIG.map((s) => (
        <div
          key={s.key}
          className="glass-card rounded-2xl p-6 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 leading-none">
              {s.label}
            </span>
            <s.Icon className={`w-5 h-5 flex-shrink-0 opacity-80 ${s.color.split(" ")[1] || ""}`} />
          </div>
          <div className="mt-auto pt-2">
            <p className="text-3xl font-display font-extrabold text-primary-900 tracking-tight">
              {loading ? "—" : (stats[s.key] ?? "—")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
