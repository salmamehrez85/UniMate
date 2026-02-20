import { PerformanceHeader } from "../components/Performance/PerformanceHeader";
import { AIRecommendations } from "../components/Performance/AIRecommendations";
import { CoursePerformanceCard } from "../components/Performance/CoursePerformanceCard";

const PERFORMANCE_DATA = [
  {
    id: 1,
    code: "CS 301",
    title: "Data Structures",
    currentGrade: 88,
    predictedRange: "85-92%",
    status: "On Track",
  },
  {
    id: 2,
    code: "CS 302",
    title: "Algorithm Analysis",
    currentGrade: 92,
    predictedRange: "90-95%",
    status: "On Track",
  },
  {
    id: 3,
    code: "MATH 202",
    title: "Calculus II",
    currentGrade: 75,
    predictedRange: "72-80%",
    status: "Watch",
  },
  {
    id: 4,
    code: "CS 305",
    title: "Database Systems",
    currentGrade: 81,
    predictedRange: "78-85%",
    status: "On Track",
  },
  {
    id: 5,
    code: "PHYS 101",
    title: "Physics",
    currentGrade: 68,
    predictedRange: "65-73%",
    status: "At Risk",
  },
  {
    id: 6,
    code: "MATH 203",
    title: "Linear Algebra",
    currentGrade: 85,
    predictedRange: "83-89%",
    status: "On Track",
  },
];

export function Performance() {
  return (
    <div className="space-y-6 mt-20 px-6 pb-24 md:pb-6">
      {/* Page Header */}
      <div>
        <p className="text-gray-600">Track your academic progress and grades</p>
      </div>

      {/* GPA Cards */}
      <PerformanceHeader />

      {/* AI Recommendations */}
      <AIRecommendations />

      {/* Course Performance Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Course Performance
        </h2>
        <div className="space-y-4">
          {PERFORMANCE_DATA.map((course) => (
            <CoursePerformanceCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
