import { Calendar, Mail } from "lucide-react";

export function CourseCard({ course }) {
  const getCodeBgColor = (code) => {
    const colors = {
      "CS 301": "bg-blue-500",
      "CS 302": "bg-purple-500",
      "MATH 202": "bg-teal-500",
      "CS 305": "bg-blue-700",
      "PHYS 101": "bg-orange-500",
      "MATH 203": "bg-pink-500",
    };
    return colors[code] || "bg-primary-500";
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
