import { Lightbulb, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getAIRecommendations,
  refreshAIRecommendations,
} from "../../services/courseService";

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [cachedAt, setCachedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await getAIRecommendations();
        setRecommendations(data.data || []);
        setCachedAt(data.cachedAt || null);
      } catch (err) {
        console.error(" Error fetching recommendations:", err);
        setError(err.message);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await refreshAIRecommendations();
      setRecommendations(data.data || []);
      setCachedAt(data.cachedAt || null);
    } catch (err) {
      console.error(" Error refreshing recommendations:", err);
      setError("Failed to refresh. Try again later.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCachedAt = (ts) => {
    if (!ts) return null;
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "green":
        return "bg-emerald-500";
      case "yellow":
        return "bg-yellow-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">
            AI Recommendations
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          title="Recalculate with AI"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition">
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Calculating…" : "Refresh"}
        </button>
      </div>

      {cachedAt && !loading && (
        <p className="text-xs text-blue-400 mb-3">
          Last updated: {formatCachedAt(cachedAt)}
        </p>
      )}

      {(loading || isRefreshing) && (
        <div className="text-center py-4">
          <p className="text-gray-600">
            {isRefreshing
              ? "Running AI analysis…"
              : "Loading recommendations..."}
          </p>
        </div>
      )}

      {error && !isRefreshing && (
        <div className="text-center py-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !isRefreshing && recommendations.length === 0 && !error && (
        <div className="text-center py-4">
          <p className="text-gray-600">
            {cachedAt
              ? "No active courses in last calculation"
              : "Click Refresh to generate AI recommendations"}
          </p>
        </div>
      )}

      {!loading && !isRefreshing && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex gap-3">
              <div
                className={`w-2 h-2 ${getStatusColor(rec.status)} rounded-full mt-2 flex-shrink-0`}></div>
              <div>
                <p className="font-semibold text-gray-900">
                  {rec.courseCode} - {rec.courseName}
                </p>
                <p className="text-sm text-gray-600">{rec.summaryAdvice}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
