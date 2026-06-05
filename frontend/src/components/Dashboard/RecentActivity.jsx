import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

function ActivityItem({ activity }) {
  const IconComponent = activity.Icon || Activity;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-100/60 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: "var(--card-glass-bg-subtle)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: activity.gradientBg || "linear-gradient(135deg,#4f46e5,#7c3aed)",
          boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
        }}
      >
        <IconComponent
          style={{
            width: "1.1rem",
            height: "1.1rem",
            color: "white",
            stroke: "white",
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm leading-tight">
          {activity.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">
          {activity.subtitle}
        </p>
      </div>
      {activity.badge && (
        <span
          className="text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded-lg shrink-0"
          style={{
            background: "rgba(99,102,241,0.08)",
            color: "#6366f1",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          {activity.badge}
        </span>
      )}
    </div>
  );
}

export function RecentActivity({ activities = [], loading = false }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card rounded-2xl p-6 shadow-xs">
      {/* Section title */}
      <div className="section-title">
        <div className="section-title-icon">
          <Activity />
        </div>
        <span className="text-gradient-brand">
          {t("dashboard.recentActivity.title")}
        </span>
      </div>

      <div className="space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-indigo-50/40 rounded-xl animate-pulse" />
          ))
        ) : activities.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {t("dashboard.recentActivity.empty")}
          </p>
        ) : (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
}
