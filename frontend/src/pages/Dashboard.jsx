import { WelcomeSection } from "../components/Dashboard/WelcomeSection";
import { StatsCards } from "../components/Dashboard/StatsCards";
import { UpcomingTasks } from "../components/Dashboard/UpcomingTasks";
import { CourseProgress } from "../components/Dashboard/CourseProgress";
import { RecentActivity } from "../components/Dashboard/RecentActivity";
import { QuickActions } from "../components/Dashboard/QuickActions";
import { useDashboardData } from "../hooks/useDashboardData";
import { useTranslation } from "react-i18next";

export function Dashboard({ onNavigate }) {
  const { t } = useTranslation();
  const {
    userName,
    tasksToday,
    stats,
    upcomingTasks,
    courseProgress,
    recentActivity,
    loading,
  } = useDashboardData();

  return (
    <div className="mt-20 pb-24">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <WelcomeSection userName={userName} tasksToday={tasksToday} />

        <div>
          <h3 className="text-xl font-bold text-primary-900 mb-6 tracking-tight">
            {t("dashboard.statistics")}
          </h3>
          <StatsCards stats={stats} loading={loading} />
        </div>

        <QuickActions onNavigate={onNavigate} />

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-7 pt-2">
          <UpcomingTasks tasks={upcomingTasks} loading={loading} />
          <CourseProgress courses={courseProgress} loading={loading} />
        </div>

        <RecentActivity activities={recentActivity} loading={loading} />
      </div>
    </div>
  );
}
