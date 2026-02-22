import { useState, useEffect } from "react";
import { TrendingUp, Award } from "lucide-react";
import {
  calculateCurrentGPA,
  getPredictedGPA,
} from "../../services/courseService";

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
  const [gpaData, setGpaData] = useState({
    gpa: 0,
    totalCredits: 0,
    completedCourses: 0,
    isLoading: true,
  });
  const [predictedData, setPredictedData] = useState({
    min: 0,
    max: 0,
    activeCourses: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchGPA = async () => {
      try {
        const data = await calculateCurrentGPA();
        setGpaData({
          ...data,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching GPA:", error);
        setGpaData({
          gpa: 0,
          totalCredits: 0,
          completedCourses: 0,
          isLoading: false,
        });
      }
    };

    const fetchPredictedGPA = async () => {
      try {
        const data = await getPredictedGPA();
        setPredictedData({
          min: data.predictedGPA.min,
          max: data.predictedGPA.max,
          activeCourses: data.breakdown.activeCourses,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching predicted GPA:", error);
        setPredictedData({
          min: 0,
          max: 0,
          activeCourses: 0,
          isLoading: false,
        });
      }
    };

    fetchGPA();
    fetchPredictedGPA();
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Current GPA Card */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-gray-600" />
          <p className="text-sm font-medium text-gray-600">Current GPA</p>
        </div>
        {gpaData.isLoading ? (
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
          </div>
        ) : (
          <>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              {gpaData.gpa > 0 ? gpaData.gpa.toFixed(2) : "N/A"}
            </h2>
            <p className="text-sm text-gray-600">
              {gpaData.completedCourses > 0
                ? `${currentSemester} • ${gpaData.completedCourses} completed course${gpaData.completedCourses !== 1 ? "s" : ""}`
                : "No completed courses yet"}
            </p>
          </>
        )}
      </div>

      {/* Predicted GPA Card */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-500" />
          <p className="text-sm font-medium text-gray-600">Predicted GPA</p>
        </div>
        {predictedData.isLoading ? (
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded animate-pulse w-40"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
          </div>
        ) : (
          <>
            <h2 className="text-4xl font-bold text-teal-500 mb-2">
              {predictedData.min > 0 && predictedData.max > 0
                ? `${predictedData.min.toFixed(2)} - ${predictedData.max.toFixed(2)}`
                : "N/A"}
            </h2>
            <p className="text-sm text-gray-600">
              {predictedData.activeCourses > 0
                ? `Based on ${predictedData.activeCourses} active course${predictedData.activeCourses !== 1 ? "s" : ""} and past performance`
                : "Complete some courses to see predictions"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
