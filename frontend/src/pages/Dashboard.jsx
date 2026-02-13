import { WelcomeSection } from "../components/Dashboard/WelcomeSection";
import { StatsCards } from "../components/Dashboard/StatsCards";
import { UpcomingTasks } from "../components/Dashboard/UpcomingTasks";
import { CourseProgress } from "../components/Dashboard/CourseProgress";
import { RecentActivity } from "../components/Dashboard/RecentActivity";
import { QuickActions } from "../components/Dashboard/QuickActions";

export function Dashboard() {
  return (
    <div className="mt-20 pb-24">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <WelcomeSection />

        <div>
          <h3 className="text-xl font-bold text-primary-900 mb-6 tracking-tight">
            Your Statistics
          </h3>
          <StatsCards />
        </div>

        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-7 pt-2">
          <UpcomingTasks />
          <CourseProgress />
        </div>

        <RecentActivity />
      </div>
    </div>
  );
}
