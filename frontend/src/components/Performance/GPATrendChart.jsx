import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getGPATrend } from "../../services/courseService";

export function GPATrendChart() {
  const [gpaTrendData, setGpaTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGPATrend = async () => {
      try {
        setLoading(true);
        const response = await getGPATrend();

        if (response.success && response.gpaTrend) {
          setGpaTrendData(response.gpaTrend);
          setError(null);
        } else {
          setError("No GPA data available");
          setGpaTrendData([]);
        }
      } catch (err) {
        console.error("Error fetching GPA trend:", err);
        setError(err.message || "Failed to load GPA trend data");
        setGpaTrendData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGPATrend();
  }, []);

  const hasPredictedData = gpaTrendData.some((d) => d.isPredicted);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">GPA Trend</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">Loading GPA trend data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">GPA Trend</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">
            {error === "No GPA data available"
              ? "No completed courses yet. Your GPA trend will appear here once you complete courses."
              : error}
          </p>
        </div>
      </div>
    );
  }

  if (gpaTrendData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">GPA Trend</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">
            No completed courses yet. Your GPA trend will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">GPA Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={gpaTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="semester"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            domain={[2.5, 4]}
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            formatter={(value) => value.toFixed(2)}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-gray-700 font-semibold">
                      {data.semester}
                    </p>
                    <p
                      className={`font-bold ${
                        data.isPredicted ? "text-amber-600" : "text-cyan-600"
                      }`}>
                      GPA: {data.gpa.toFixed(2)}
                    </p>
                    {data.isPredicted && (
                      <p className="text-amber-600 text-sm font-semibold">
                        (Predicted)
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* Single line with conditional dot coloring for historical vs predicted */}
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="#0891b2"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              // Cyan for historical, amber for predicted
              const color = payload.isPredicted ? "#f59e0b" : "#0891b2";
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill={color}
                  stroke={color}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 8 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {gpaTrendData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Total Semesters:{" "}
            <span className="font-semibold">
              {gpaTrendData.filter((d) => !d.isPredicted).length}
            </span>
          </p>
          {hasPredictedData && (
            <p className="text-sm text-amber-600 mt-2">
              <span className="font-semibold">Predicted GPA:</span> Based on
              current semester performance
            </p>
          )}
        </div>
      )}
    </div>
  );
}
