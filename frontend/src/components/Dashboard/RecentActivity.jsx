import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

function ActivityItem({ activity }) {
  const IconComponent = activity.Icon || Activity;

  return (
    <div className="flex items-start gap-4 pb-5 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50 px-3 py-3 rounded transition-colors">
      <div
        className={`w-12 h-12 ${activity.bgColor} rounded-full flex items-center justify-center shrink-0`}>
        <IconComponent className={`w-6 h-6 ${activity.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-base">
          {activity.title}
        </p>
        <p className="text-sm text-gray-600 mt-1">{activity.subtitle}</p>
      </div>
      {activity.badge && (
        <span
          className={`text-sm font-bold ${activity.badgeColor} bg-opacity-10 px-3 py-1.5 rounded-full shrink-0`}>
          {activity.badge}
        </span>
      )}
    </div>
  );
}

export function RecentActivity({ activities = [], loading = false }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg p-7 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-primary-900 mb-7 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        {t("dashboard.recentActivity.title")}
      </h3>
      <div className="space-y-5">
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
