import { useState, useEffect } from "react";
import { PerformanceHeader } from "../components/Performance/PerformanceHeader";
import { AIRecommendations } from "../components/Performance/AIRecommendations";
import { GPATrendChart } from "../components/Performance/GPATrendChart";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  Zap,
  ChevronDown,
} from "lucide-react";
import { getCourses, getPredictedGPA } from "../services/courseService";

function PredictionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );
}

function ActiveCourseCard({
  course,
  predictions,
  onPredictClick,
  onViewInsights,
}) {
  const prediction = predictions[course.id];
  const isLoading = course.isLoading;

  const getStatusColor = (status) => {
    switch (status) {
      case "On Track":
        return "text-emerald-600";
      case "Watch":
        return "text-amber-600";
      case "At Risk":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "On Track":
        return "bg-emerald-50 border-emerald-200";
      case "Watch":
        return "bg-amber-50 border-amber-200";
      case "At Risk":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "On Track":
        return "🟢";
      case "Watch":
        return "🟡";
      case "At Risk":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getProgressBarColor = (grade) => {
    if (grade >= 85) return "bg-emerald-500";
    if (grade >= 75) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-6 shadow-sm transition-all ${
        prediction
          ? "border-teal-200 hover:shadow-md"
          : "border-gray-100 hover:shadow-md"
      }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Course Code: {course.code}
          </p>
        </div>
      </div>

      {/* Current Grade */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 font-medium mb-1">Current Grade</p>
        <p className="text-3xl font-bold text-gray-900">
          {course.currentGrade.toFixed(1)}%
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4">
          <PredictionSkeleton />
        </div>
      )}

      {/* Predicted State */}
      {prediction && !isLoading && (
        <div className="mb-4 space-y-3">
          {/* Predicted Range */}
          <div>
            <p className="text-xs text-gray-600 font-medium mb-1">
              Predicted Final Grade
            </p>
            <p className="text-2xl font-bold text-teal-600">
              {prediction.predictedRange.min}% - {prediction.predictedRange.max}
              %
            </p>
          </div>

          {/* Status Indicator */}
          <div
            className={`rounded-lg border p-3 ${getStatusBgColor(
              prediction.status,
            )}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {getStatusIcon(prediction.status)}
              </span>
              <span
                className={`text-sm font-semibold ${getStatusColor(
                  prediction.status,
                )}`}>
                {prediction.status}
              </span>
              <span className="text-xs text-gray-600 ml-auto">
                Confidence: {prediction.confidence}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${getProgressBarColor(
                  (prediction.predictedRange.min +
                    prediction.predictedRange.max) /
                    2,
                )}`}
                style={{
                  width: `${(prediction.predictedRange.min + prediction.predictedRange.max) / 2}%`,
                }}></div>
            </div>
          </div>

          {/* View Insights Button */}
          <button
            onClick={() => onViewInsights(course.id, prediction)}
            className="w-full mt-3 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            View AI Insights
          </button>
        </div>
      )}

      {/* Predict Button */}
      {!prediction && !isLoading && (
        <button
          onClick={() => onPredictClick(course.id)}
          className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5" />
          Predict Final Grade
        </button>
      )}
    </div>
  );
}

function AIInsightsModal({
  isOpen,
  onClose,
  courseId,
  courseName,
  prediction,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              AI Prediction Insights
            </h2>
            <p className="text-sm text-gray-600 mt-1">{courseName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Confidence Level */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Confidence Level</h3>
            </div>
            <p className="text-blue-800">
              This prediction is based on{" "}
              <span className="font-bold text-lg">{prediction.confidence}</span>{" "}
              confidence analysis of your historical performance patterns.
            </p>
          </div>

          {/* Similar Courses */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Top Similar Past Courses
            </h3>
            <div className="space-y-3">
              {prediction.similarCoursesUsed.map((course, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {idx + 1}. {course.name}
                    </h4>
                    <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {course.similarity}% Similar
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{course.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Personalized Recommendation
                </h3>
                <p className="text-sm text-amber-800">
                  {prediction.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function Performance() {
  const [courses, setCourses] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch active courses from MongoDB on component mount
  useEffect(() => {
    const fetchActiveCourses = async () => {
      try {
        setLoading(true);
        const data = await getCourses();

        // Filter only active courses (isOldCourse !== true)
        const activeCourses = (data.courses || [])
          .filter((course) => course.isOldCourse !== true)
          .map((course) => {
            // Calculate current grade from assessments
            const assessments = course.assessments || [];
            const currentAssessments = assessments.filter(
              (a) =>
                a.type !== "final" && a.score != null && a.maxScore != null,
            );

            let currentGrade = 0;
            if (currentAssessments.length > 0) {
              const totalPercentage = currentAssessments.reduce((sum, a) => {
                return sum + (a.score / a.maxScore) * 100;
              }, 0);
              currentGrade = totalPercentage / currentAssessments.length;
            }

            return {
              id: course._id,
              name: course.name,
              code: course.code,
              currentGrade: currentGrade || 0,
              isPredicted: false,
              isLoading: false,
            };
          });

        setCourses(activeCourses);
        setError(null);
      } catch (err) {
        console.error(" Error fetching courses:", err);
        setError(err.message || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCourses();
  }, []);

  const handlePredictClick = async (courseId) => {
    // Set loading state
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, isLoading: true } : c)),
    );

    try {
      const response = await getPredictedGPA();

      // Find the prediction data for this specific course
      const courseActivePredictions = response.activeCoursePredictions || [];
      const coursePrediction = courseActivePredictions.find(
        (p) => p.courseId === courseId,
      );

      if (coursePrediction) {
        const course = courses.find((c) => c.id === courseId);
        const prediction = {
          predictedRange: {
            min: coursePrediction.prediction.min,
            max: coursePrediction.prediction.max,
          },
          status:
            coursePrediction.prediction.confidence === "High"
              ? "On Track"
              : coursePrediction.prediction.confidence === "Medium"
                ? "Watch"
                : "At Risk",
          confidence: coursePrediction.prediction.confidence,
          similarCoursesUsed: (
            coursePrediction.prediction.similarCourses || []
          ).map((sc) => ({
            name: sc.name,
            similarity: Math.round(sc.similarity * 100),
            reason: sc.reason,
          })),
          recommendation: `Based on your current performance of ${Math.round(coursePrediction.currentPerformance)}%, the AI predicts you will score between ${coursePrediction.prediction.min}% and ${coursePrediction.prediction.max}% in this course. Focus on areas where you've had lower scores.`,
        };

        setPredictions((prev) => ({
          ...prev,
          [courseId]: prediction,
        }));
      }
    } catch (err) {
      console.error(" Error fetching predictions:", err);
    } finally {
      // Clear loading state
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, isLoading: false } : c)),
      );
    }
  };

  const handleViewInsights = (courseId, prediction) => {
    const course = courses.find((c) => c.id === courseId);
    setSelectedInsight({
      courseId,
      courseName: course.name,
      prediction,
    });
  };

  return (
    <div className="space-y-8 mt-20 px-6 pb-24 md:pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Academic Performance
        </h1>
        <p className="text-gray-600">
          Track your progress and get AI-powered predictions for your courses
        </p>
      </div>

      {/* GPA Overview */}
      <PerformanceHeader />

      {/* GPA Trend Chart */}
      <GPATrendChart />

      {/* Active Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Current Courses</h2>
          <span className="text-sm text-gray-600">
            Click "Predict Final Grade" to get AI insights
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
              <p className="text-gray-600">Loading courses...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold">Error loading courses</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-700 font-semibold">
              No active courses found
            </p>
            <p className="text-blue-600 text-sm">
              Add courses to see predictions and recommendations
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <ActiveCourseCard
                key={course.id}
                course={course}
                predictions={predictions}
                onPredictClick={handlePredictClick}
                onViewInsights={handleViewInsights}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <AIRecommendations />

      {/* AI Insights Modal */}
      {selectedInsight && (
        <AIInsightsModal
          isOpen={true}
          onClose={() => setSelectedInsight(null)}
          courseId={selectedInsight.courseId}
          courseName={selectedInsight.courseName}
          prediction={selectedInsight.prediction}
        />
      )}
    </div>
  );
}
