import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { getAIRecommendations } from "../../services/courseService";

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const data = await getAIRecommendations();
        setRecommendations(data.data || []);
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
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">
          AI Recommendations
        </h3>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-600">Loading recommendations...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-red-600">Failed to load recommendations</p>
        </div>
      )}

      {!loading && recommendations.length === 0 && !error && (
        <div className="text-center py-4">
          <p className="text-gray-600">
            No active courses to generate recommendations
          </p>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex gap-3">
              <div
                className={`w-2 h-2 ${getStatusColor(rec.status)} rounded-full mt-2 flex-shrink-0`}></div>
              <div>
                <p className="font-semibold text-gray-900">
                  {rec.courseCode} - {rec.courseName}
                </p>
                <p className="text-sm text-gray-600">{rec.advice}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
