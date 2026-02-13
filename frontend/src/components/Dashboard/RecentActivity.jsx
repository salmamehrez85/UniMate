import { CheckCircle2, BookOpen, FileText } from 'lucide-react';

const ACTIVITIES = [
  {
    id: 1,
    title: 'Completed Quiz: Data Structures',
    subtitle: 'Computer Science • 2 hours ago',
    badge: '95%',
    badgeColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    Icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  {
    id: 2,
    title: 'Started new course: Advanced Calculus',
    subtitle: 'Mathematics • Yesterday',
    badge: null,
    bgColor: 'bg-blue-100',
    Icon: BookOpen,
    iconColor: 'text-primary-600',
  },
  {
    id: 3,
    title: 'Submitted Assignment: Lab Report',
    subtitle: 'Physics • 2 days ago',
    badge: 'On time',
    badgeColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    Icon: FileText,
    iconColor: 'text-purple-600',
  },
];

function ActivityItem({ activity }) {
  const IconComponent = activity.Icon;

  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
      <div className={`w-10 h-10 ${activity.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
        <IconComponent className={`w-5 h-5 ${activity.iconColor}`} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-primary-900">{activity.title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{activity.subtitle}</p>
      </div>
      {activity.badge && <span className={`text-sm font-bold ${activity.badgeColor}`}>{activity.badge}</span>}
    </div>
  );
}

export function RecentActivity() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-primary-900 mb-5">Recent Activity</h3>
      <div className="space-y-4">
        {ACTIVITIES.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
