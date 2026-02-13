const COURSES_DATA = [
  { id: 1, name: "Mathematics", progress: 75, color: "bg-primary-500" },
  { id: 2, name: "Physics", progress: 60, color: "bg-teal-500" },
  { id: 3, name: "Computer Science", progress: 80, color: "bg-primary-600" },
  { id: 4, name: "Chemistry", progress: 45, color: "bg-primary-400" },
];

function CourseItem({ course }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-primary-900">{course.name}</span>
        <span className="text-sm font-bold text-primary-600">
          {course.progress}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${course.color} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${course.progress}%` }}
        />
      </div>
    </div>
  );
}

export function CourseProgress() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-primary-900">Course Progress</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {COURSES_DATA.map((course) => (
          <CourseItem key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
