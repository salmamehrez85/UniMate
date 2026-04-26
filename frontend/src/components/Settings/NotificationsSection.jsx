import { useState } from "react";
import { Bell } from "lucide-react";

const NOTIFICATION_ITEMS = [
  {
    id: "assignments",
    label: "Assignment reminders",
    description: "Get reminded before deadlines",
  },
  {
    id: "quizzes",
    label: "Quiz availability",
    description: "Notified when new quizzes are ready",
  },
  {
    id: "performance",
    label: "Performance updates",
    description: "Weekly summary of your progress",
  },
];

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
        enabled ? "bg-primary-600" : "bg-gray-200"
      }`}>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    assignments: true,
    quizzes: true,
    performance: false,
  });

  const toggle = (id) => setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
      </div>
      <div className="space-y-4">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
            <Toggle enabled={prefs[item.id]} onChange={() => toggle(item.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
