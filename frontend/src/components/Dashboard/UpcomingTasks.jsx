import { ListTodo } from "lucide-react";
import { useTranslation } from "react-i18next";

function TaskItem({ task, t }) {
  const isHigh = task.priority === "high";
  const priorityGlow = isHigh
    ? "border-l-4 border-red-500 shadow-red-100"
    : "border-l-4 border-amber-400 shadow-amber-100";

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-gray-100/80 hover:border-indigo-100 hover:shadow-md hover:-translate-y-0.5 shadow-sm ${priorityGlow}`}
      style={{ background: "var(--card-glass-bg)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight">{task.title}</h4>
        <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-widest uppercase">
          {task.course}
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              isHigh
                ? "bg-red-500/10 text-red-500 border border-red-400/20"
                : "bg-amber-400/10 text-amber-600 border border-amber-400/20"
            }`}
          >
            {isHigh
              ? t("dashboard.upcomingTasks.priorityHigh")
              : t("dashboard.upcomingTasks.priorityMedium")}
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {task.daysLeft === 0
              ? t("dashboard.upcomingTasks.dueToday")
              : t("dashboard.upcomingTasks.daysLeft", { count: task.daysLeft })}
          </span>
        </div>
      </div>
    </div>
  );
}

export function UpcomingTasks({ tasks = [], loading = false }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card rounded-2xl p-6 shadow-xs">
      {/* Section title */}
      <div className="section-title">
        <div className="section-title-icon">
          <ListTodo />
        </div>
        <span className="text-gradient-brand">
          {t("dashboard.upcomingTasks.title")}
        </span>
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-indigo-50/40 rounded-xl animate-pulse" />
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
