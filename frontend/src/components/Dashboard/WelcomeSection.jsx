import { useTranslation } from "react-i18next";

export function WelcomeSection({ userName = "Student", tasksToday = 0 }) {
  const { t } = useTranslation();

  const taskText =
    tasksToday === 0
      ? t("dashboard.noTasksToday")
      : t("dashboard.tasksDueToday", { count: tasksToday });

  return (
    <div className="welcome-banner bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-12 shadow-lg">
      <h2 className="text-4xl font-bold mb-4 text-black leading-tight">
        {t("dashboard.welcomeTitle", { userName })}
      </h2>
      <p className="text-black/80 text-lg leading-relaxed max-w-2xl">
        {taskText}
      </p>
    </div>
  );
}
