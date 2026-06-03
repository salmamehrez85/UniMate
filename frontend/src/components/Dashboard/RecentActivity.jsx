import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

function ActivityItem({ activity }) {
  const IconComponent = activity.Icon || Activity;

  return (
    <div className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-slate-50/50 hover:-translate-y-0.5 duration-200 px-3 py-3 border border-transparent hover:border-slate-100/30 rounded-xl transition-all">
      <div
        className={`w-10 h-10 ${activity.bgColor} bg-opacity-20 rounded-xl flex items-center justify-center shrink-0 border border-current border-opacity-10`}>
        <IconComponent className={`w-5 h-5 ${activity.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm leading-tight">
          {activity.title}
        </p>
        <p className="text-xs text-gray-400 mt-1 font-medium">{activity.subtitle}</p>
      </div>
      {activity.badge && (
        <span
          className={`text-[9px] font-bold tracking-wider uppercase border ${activity.badgeColor} bg-white/20 px-2 py-0.5 rounded shrink-0`}>
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
      <h3 className="text-lg font-display font-extrabold text-primary-900 mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary-600" />
        {t("dashboard.recentActivity.title")}
      </h3>
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-lg animate-pulse"
            />
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
