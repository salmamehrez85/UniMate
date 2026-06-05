import { useTranslation } from "react-i18next";

export function WelcomeSection({ userName = "Student", tasksToday = 0 }) {
  const { t } = useTranslation();

  const taskText =
    tasksToday === 0
      ? t("dashboard.noTasksToday")
      : t("dashboard.tasksDueToday", { count: tasksToday });

  return (
    <div className="welcome-banner">
      {/* Decorative blobs */}
      <div className="wb-blob wb-blob-1" />
      <div className="wb-blob wb-blob-2" />
      <div className="wb-blob wb-blob-3" />

      {/* Floating particles */}
      <div className="wb-particle wb-p1" />
      <div className="wb-particle wb-p2" />
      <div className="wb-particle wb-p3" />
      <div className="wb-particle wb-p4" />
      <div className="wb-particle wb-p5" />

      {/* Content */}
      <div className="wb-content">
        <div className="wb-badge">
          <span className="wb-badge-dot" />
          {tasksToday > 0
            ? `${tasksToday} task${tasksToday > 1 ? "s" : ""} due today`
            : "You're all caught up 🎉"}
        </div>

        <h2 className="wb-title">
          <span className="wb-wave">👋</span>{" "}
          {t("dashboard.welcomeTitle", { userName })}
        </h2>

        <p className="wb-subtitle">{taskText}</p>

        <div className="wb-divider" />

        <div className="wb-stats">
          <div className="wb-stat">
            <span className="wb-stat-icon">📚</span>
            <span className="wb-stat-label">Keep learning</span>
          </div>
          <div className="wb-stat">
            <span className="wb-stat-icon">🎯</span>
            <span className="wb-stat-label">Stay focused</span>
          </div>
          <div className="wb-stat">
            <span className="wb-stat-icon">🚀</span>
            <span className="wb-stat-label">Make progress</span>
          </div>
        </div>
      </div>
    </div>
  );
}
