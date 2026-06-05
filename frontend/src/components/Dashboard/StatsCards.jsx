import { BookOpen, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

const CARD_CONFIGS = [
  {
    key:       "activeCourses",
    Icon:      BookOpen,
    accent:    "stat-card-indigo",
    iconStyle: { background: "linear-gradient(135deg,#6366f1,#818cf8)" },
    iconColor: "white",
  },
  {
    key:       "pendingTasks",
    Icon:      CheckCircle,
    accent:    "stat-card-emerald",
    iconStyle: { background: "linear-gradient(135deg,#10b981,#34d399)" },
    iconColor: "white",
  },
  {
    key:       "avgPerformance",
    Icon:      TrendingUp,
    accent:    "stat-card-violet",
    iconStyle: { background: "linear-gradient(135deg,#7c3aed,#a78bfa)" },
    iconColor: "white",
  },
  {
    key:       "studyHours",
    Icon:      Clock,
    accent:    "stat-card-amber",
    iconStyle: { background: "linear-gradient(135deg,#f59e0b,#fcd34d)" },
    iconColor: "white",
  },
];

export function StatsCards({ stats = {}, loading = false }) {
  const { t } = useTranslation();

  const labels = {
    activeCourses:  t("dashboard.stats.activeCourses"),
    pendingTasks:   t("dashboard.stats.pendingTasks"),
    avgPerformance: t("dashboard.stats.avgPerformance"),
    studyHours:     t("dashboard.stats.completedTasks"),
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {CARD_CONFIGS.map((c) => (
        <div
          key={c.key}
          className={`stat-card-premium ${c.accent} cursor-pointer`}
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 leading-none pr-2">
              {labels[c.key]}
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={c.iconStyle}
            >
              <c.Icon
                style={{ width: "1rem", height: "1rem", color: c.iconColor, stroke: c.iconColor }}
              />
            </div>
          </div>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background:
                "linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {loading ? "—" : (stats[c.key] ?? "—")}
          </p>
        </div>
      ))}
    </div>
  );
}
