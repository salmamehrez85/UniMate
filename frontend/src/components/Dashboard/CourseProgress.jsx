import { BookOpen } from "lucide-react";

const COURSES_DATA = [
  { id: 1, name: "Mathematics", progress: 75, color: "bg-blue-500" },
  { id: 2, name: "Physics", progress: 60, color: "bg-teal-500" },
  { id: 3, name: "Computer Science", progress: 80, color: "bg-purple-500" },
  { id: 4, name: "Chemistry", progress: 45, color: "bg-orange-500" },
];

function CourseItem({ course }) {
  return (
    <div className="pb-1">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-900 text-base">
          {course.name}
        </span>
        <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full">
          {course.progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${course.color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${course.progress}%` }}
        />
      </div>
    </div>
  );
}

export function CourseProgress() {
  return (
    <div className="bg-white rounded-lg p-7 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-7">
        <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Course Progress
        </h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-6">
        {COURSES_DATA.map((course) => (
          <CourseItem key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
