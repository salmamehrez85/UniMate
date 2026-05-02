import { CheckCircle, Circle } from "lucide-react";
import { formatDueLabel, getDaysUntil } from "./taskUtils";
import { useTranslation } from "react-i18next";

const priorityStyles = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const statusStyles = {
  todo: "bg-gray-100 text-gray-700",
  doing: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
};

export function TasksList({ tasks, onToggleStatus, updatingTaskId }) {
  const { t } = useTranslation();
  if (tasks.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-10 text-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {t("tasks.list.noMatch")}
        </h3>
        <p className="text-gray-500 mt-2">{t("tasks.list.noMatchHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const daysLeft = task.dueDate ? getDaysUntil(task.dueDate) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0;
        const priorityClass =
          priorityStyles[task.priority] || "bg-gray-100 text-gray-600";
        const statusClass =
          statusStyles[task.status] || "bg-gray-100 text-gray-600";

        return (
          <div
            key={`${task.courseId}-${task.id}`}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleStatus(task)}
                    disabled={updatingTaskId === task.id}
                    className="mt-1 text-gray-400 hover:text-teal-500 transition">
                    {task.status === "done" ? (
                      <CheckCircle className="w-5 h-5 text-teal-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <h3
                      className={`text-lg font-semibold ${
                        task.status === "done"
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 ml-8 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">
                    {task.courseName}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span>{task.courseCode}</span>
                  {task.semester && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span>{task.semester}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${priorityClass}`}>
                  {task.priority
                    ? t(`tasks.priority.${task.priority}`)
                    : t("tasks.priority.medium")}
                </span>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${statusClass}`}>
                  {t(`tasks.status.${task.status}`)}
                </span>
                {daysLeft !== null && task.status !== "done" && (
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      isOverdue
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                    {formatDueLabel(daysLeft, t)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
