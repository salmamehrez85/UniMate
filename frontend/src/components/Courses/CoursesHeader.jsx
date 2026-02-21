import { Calendar, Plus } from "lucide-react";

function getCurrentSemester() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  let semester;
  if (month >= 3 && month <= 5) {
    semester = "Spring";
  } else if (month >= 6 && month <= 9) {
    semester = "Summer";
  } else if (month >= 10 && month <= 11) {
    semester = "Autumn";
  } else {
    // December, January, February
    semester = "Winter";
  }

  return `${semester} ${year} Semester`;
}

export function CoursesHeader({ totalCourses, onAddCourse }) {
  const currentSemester = getCurrentSemester();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-700">{currentSemester}</h1>
        <p className="text-gray-600 mt-1 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {totalCourses} active courses
        </p>
      </div>
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700">
          <Calendar className="w-5 h-5" />
          Import
        </button>
        <button
          onClick={onAddCourse}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all font-semibold">
          <Plus className="w-5 h-5" />
          Add Course
        </button>
      </div>
    </div>
  );
}
