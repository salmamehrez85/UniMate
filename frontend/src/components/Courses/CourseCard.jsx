import { Calendar, Mail } from "lucide-react";

export function CourseCard({ course, onManage }) {
  const getCodeBgColor = (code) => {
    // Generate a consistent color based on the course code
    const colors = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-teal-600",
      "bg-indigo-600",
      "bg-orange-600",
      "bg-pink-600",
      "bg-green-600",
      "bg-red-600",
      "bg-yellow-600",
      "bg-cyan-600",
    ];

    // Use a simple hash to consistently assign colors
    const hash = code
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const tasksCount = (course.tasks || []).length;

  return (
    <div className="bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
      {/* Header with code badge and task count */}
      <div className="p-5 flex items-start justify-between border-b border-gray-100">
        <span
          className={`${getCodeBgColor(
            course.code,
          )} text-white text-sm font-semibold px-3 py-1 rounded`}>
          {course.code}
        </span>
        <span className="text-gray-500 text-sm font-medium">
          {tasksCount} tasks
        </span>
      </div>

      {/* Course details */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-gray-900">
          {course.name || course.title}
        </h3>

        <p className="text-gray-600 text-sm">
          {course.instructor || "Not specified"}
        </p>

        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar className="w-4 h-4" />
          {course.schedule || "N/A"}
        </div>
      </div>

      {/* Footer with actions */}
      <div className="px-5 py-4 bg-white border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={onManage}
          className="flex-1 text-center px-4 py-2 bg-gray-100 border border-gray-200 text-primary-600 hover:text-primary-700 hover:bg-gray-200 hover:border-gray-300 font-medium text-sm transition-colors rounded">
          Manage Course
        </button>
        <button className="px-3 py-2 bg-gray-100 border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-gray-200 hover:border-gray-300 transition-colors rounded">
          <Mail className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
