import { useState, useEffect } from "react";
import { TrendingUp, Award, RefreshCw } from "lucide-react";
import {
  calculateCurrentGPA,
  getPredictedGPA,
  refreshPredictedGPA,
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
    cachedAt: null,
    isLoading: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const applyPredictedData = (data) => {
    setPredictedData({
      min: data.predictedGPA?.min ?? 0,
      max: data.predictedGPA?.max ?? 0,
      activeCourses: data.breakdown?.activeCourses ?? 0,
      cachedAt: data.cachedAt ?? null,
      isLoading: false,
    });
  };

  useEffect(() => {
    const fetchGPA = async () => {
      try {
        const data = await calculateCurrentGPA();
        setGpaData({ ...data, isLoading: false });
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
        applyPredictedData(data);
      } catch (error) {
        console.error("Error fetching predicted GPA:", error);
        setPredictedData({
          min: 0,
          max: 0,
          activeCourses: 0,
          cachedAt: null,
          isLoading: false,
        });
      }
    };

    fetchGPA();
    fetchPredictedGPA();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError("");
    try {
      const data = await refreshPredictedGPA();
      applyPredictedData(data);
    } catch (error) {
      console.error("Error refreshing predicted GPA:", error);
      setRefreshError("Failed to refresh. Try again later.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCachedAt = (cachedAt) => {
    if (!cachedAt) return null;
    return new Date(cachedAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            <p className="text-sm font-medium text-gray-600">Predicted GPA</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || predictedData.isLoading}
            title="Recalculate with AI"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition">
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Calculating…" : "Refresh"}
          </button>
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
                ? `${predictedData.min.toFixed(2)} – ${predictedData.max.toFixed(2)}`
                : "—"}
            </h2>
            <p className="text-sm text-gray-600">
              {predictedData.activeCourses > 0
                ? `Based on ${predictedData.activeCourses} active course${predictedData.activeCourses !== 1 ? "s" : ""} and past performance`
                : predictedData.cachedAt
                  ? "No active courses in last calculation"
                  : "Click Refresh to calculate your predicted GPA"}
            </p>
            {predictedData.cachedAt && (
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {formatCachedAt(predictedData.cachedAt)}
              </p>
            )}
            {refreshError && (
              <p className="text-xs text-red-600 mt-1">{refreshError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
