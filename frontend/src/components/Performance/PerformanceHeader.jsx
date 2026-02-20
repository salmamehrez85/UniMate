import { TrendingUp, Award } from "lucide-react";

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

export function PerformanceHeader() {
  const currentSemester = getCurrentSemester();

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Current GPA Card */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-gray-600" />
          <p className="text-sm font-medium text-gray-600">Current GPA</p>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-2">3.45</h2>
        <p className="text-sm text-gray-600">{currentSemester}</p>
      </div>

      {/* Predicted GPA Card */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-500" />
          <p className="text-sm font-medium text-gray-600">Predicted GPA</p>
        </div>
        <h2 className="text-4xl font-bold text-teal-500 mb-2">3.52 - 3.71</h2>
        <p className="text-sm text-gray-600">Based on current performance</p>
      </div>
    </div>
  );
}
