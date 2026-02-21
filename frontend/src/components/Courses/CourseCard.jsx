import { Calendar, Mail } from "lucide-react";

export function CourseCard({ course }) {
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
          {course.tasks} tasks
        </span>
      </div>

      {/* Course details */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>

        <p className="text-gray-600 text-sm">Dr. {course.instructor}</p>

        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar className="w-4 h-4" />
          {course.schedule}
        </div>
      </div>

      {/* Footer with actions */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors">
          View Details
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Mail className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
