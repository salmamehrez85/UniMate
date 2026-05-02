import { ListTodo } from "lucide-react";
import { useTranslation } from "react-i18next";

function getDaysLeftText(daysLeft, t) {
  if (daysLeft === 0) return t("dashboard.upcomingTasks.dueToday");
  return t("dashboard.upcomingTasks.daysLeft", { count: daysLeft });
}

function TaskItem({ task, t }) {
  return (
    <div className="flex items-start gap-3 p-5 rounded-lg hover:bg-primary-50 transition-all border border-gray-100 hover:border-primary-200">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-base">{task.title}</h4>
        <p className="text-sm text-gray-500 mt-1.5">{task.course}</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              task.priority === "high"
                ? "bg-red-100 text-red-700 font-semibold"
                : "bg-amber-100 text-amber-700"
            }`}>
            {task.priority === "high" ? t("dashboard.upcomingTasks.priorityHigh") : t("dashboard.upcomingTasks.priorityMedium")}
          </span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">
            {getDaysLeftText(task.daysLeft, t)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function UpcomingTasks({ tasks = [], loading = false }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg p-7 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-7">
        <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          {t("dashboard.upcomingTasks.title")}
        </h3>
      </div>
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-lg animate-pulse"
            />
          ))
        ) : tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {t("dashboard.upcomingTasks.empty")}
          </p>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} t={t} />)
        )}
      </div>
    </div>
  );
}
