import { ListTodo } from "lucide-react";
import { useTranslation } from "react-i18next";

function getDaysLeftText(daysLeft, t) {
  if (daysLeft === 0) return t("dashboard.upcomingTasks.dueToday");
  return t("dashboard.upcomingTasks.daysLeft", { count: daysLeft });
}

function TaskItem({ task, t }) {
  const borderClass =
    task.priority === "high"
      ? "border-l-4 border-red-500"
      : "border-l-4 border-amber-500";

  return (
    <div className={`flex items-start gap-4 p-4.5 rounded-xl bg-white/40 dark:bg-slate-900/20 transition-all border border-gray-100 hover:border-primary-100 hover:shadow-xs hover:-translate-y-0.5 duration-200 ${borderClass}`}>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm leading-tight">{task.title}</h4>
        <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-widest uppercase">{task.course}</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider transition-colors ${
              task.priority === "high"
                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            }`}>
            {task.priority === "high"
              ? t("dashboard.upcomingTasks.priorityHigh")
              : t("dashboard.upcomingTasks.priorityMedium")}
          </span>
          <span className="text-xs text-gray-300">•</span>
          <span className="text-xs text-gray-500 font-medium">
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
    <div className="glass-card rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-extrabold text-primary-900 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary-600" />
          {t("dashboard.upcomingTasks.title")}
        </h3>
      </div>
      <div className="space-y-3.5">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100/50 rounded-xl animate-pulse"
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
