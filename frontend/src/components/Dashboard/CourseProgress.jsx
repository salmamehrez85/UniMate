import { BookOpen } from "lucide-react";

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

export function CourseProgress({ courses = [], loading = false }) {
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
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded-lg animate-pulse"
            />
          ))
        ) : courses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No active courses found.
          </p>
        ) : (
          courses.map((course) => (
            <CourseItem key={course.id} course={course} />
          ))
        )}
      </div>
    </div>
  );
}
