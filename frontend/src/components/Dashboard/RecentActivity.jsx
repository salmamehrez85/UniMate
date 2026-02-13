import { CheckCircle2, BookOpen, FileText, Activity } from "lucide-react";

const ACTIVITIES = [
  {
    id: 1,
    title: "Completed Quiz: Data Structures",
    subtitle: "Computer Science • 2 hours ago",
    badge: "95%",
    badgeColor: "text-emerald-600",
    bgColor: "bg-emerald-100",
    Icon: CheckCircle2,
    iconColor: "text-emerald-600",
  },
  {
    id: 2,
    title: "Started new course: Advanced Calculus",
    subtitle: "Mathematics • Yesterday",
    badge: null,
    bgColor: "bg-blue-100",
    Icon: BookOpen,
    iconColor: "text-primary-600",
  },
  {
    id: 3,
    title: "Submitted Assignment: Lab Report",
    subtitle: "Physics • 2 days ago",
    badge: "On time",
    badgeColor: "text-purple-600",
    bgColor: "bg-purple-100",
    Icon: FileText,
    iconColor: "text-purple-600",
  },
];

function ActivityItem({ activity }) {
  const IconComponent = activity.Icon;

  return (
    <div className="flex items-start gap-4 pb-5 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50 px-3 py-3 rounded transition-colors">
      <div
        className={`w-12 h-12 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
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
          className={`text-sm font-bold ${activity.badgeColor} bg-opacity-10 px-3 py-1.5 rounded-full flex-shrink-0`}>
          {activity.badge}
        </span>
      )}
    </div>
  );
}

export function RecentActivity() {
  return (
    <div className="bg-white rounded-lg p-7 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-primary-900 mb-7 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Recent Activity
      </h3>
      <div className="space-y-5">
        {ACTIVITIES.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
