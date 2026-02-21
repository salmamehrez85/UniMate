import { CheckCircle, BookOpen, Zap } from "lucide-react";

export function OverviewTab({ course }) {
  const upcomingTasksCount = (course.tasks || []).filter(
    (t) => t.status !== "done",
  ).length;

  const assessmentsCount = (course.assessments || []).length;

  const phasesCount = (course.phases || []).length;

  const stats = [
    {
      label: "Upcoming Tasks",
      value: upcomingTasksCount,
      icon: Zap,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Assessments",
      value: assessmentsCount,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Project Phases",
      value: phasesCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-bold text-primary-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-lg`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Info Block */}
      <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-primary-900 mb-6">
          Course Information
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Course Code
            </p>
            <p className="text-lg font-semibold text-primary-900">
              {course.code}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Course Name
            </p>
            <p className="text-lg font-semibold text-primary-900">
              {course.name}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Instructor</p>
            <p className="text-lg font-semibold text-primary-900">
              {course.instructor || "Not specified"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Schedule</p>
            <p className="text-lg font-semibold text-primary-900">
              {course.schedule || "Not specified"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Credits</p>
            <p className="text-lg font-semibold text-primary-900">
              {course.credits || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Semester</p>
            <p className="text-lg font-semibold text-primary-900">
              {course.semester || "Not specified"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
