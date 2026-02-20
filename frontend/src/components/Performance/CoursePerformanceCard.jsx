import { AlertCircle } from "lucide-react";

export function CoursePerformanceCard({ course }) {
  const getStatusBadge = (status) => {
    const statusStyles = {
      "On Track": "bg-emerald-100 text-emerald-700",
      Watch: "bg-yellow-100 text-yellow-700",
      "At Risk": "bg-red-100 text-red-700",
    };
    return statusStyles[status] || "bg-gray-100 text-gray-700";
  };

  const getProgressBarColor = (grade) => {
    if (grade >= 85) return "bg-teal-500";
    if (grade >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
      {/* Header with course code and status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{course.code}</h3>
            {course.status === "At Risk" && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">{course.title}</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadge(
            course.status,
          )}`}>
          {course.status}
        </span>
      </div>

      {/* Grade comparison */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">
            Current Grade
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {course.currentGrade}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">
            Predicted Range
          </p>
          <p className="text-2xl font-bold text-teal-500">
            {course.predictedRange}%
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getProgressBarColor(course.currentGrade)}`}
          style={{ width: `${course.currentGrade}%` }}></div>
      </div>
    </div>
  );
}
