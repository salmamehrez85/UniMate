import { WelcomeSection } from '../components/Dashboard/WelcomeSection';
import { StatsCards } from '../components/Dashboard/StatsCards';
import { UpcomingTasks } from '../components/Dashboard/UpcomingTasks';
import { CourseProgress } from '../components/Dashboard/CourseProgress';
import { RecentActivity } from '../components/Dashboard/RecentActivity';

export function Dashboard() {
  return (
    <div className="space-y-6 mt-20">
      <WelcomeSection />
      <StatsCards />

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <UpcomingTasks />
        <CourseProgress />
      </div>

      <RecentActivity />
    </div>
  );
}
