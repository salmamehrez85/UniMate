import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const GPA_TREND_DATA = [
  { semester: "Fall 2024", gpa: 3.2 },
  { semester: "Spring 2025", gpa: 3.3 },
  { semester: "Fall 2025", gpa: 3.35 },
  { semester: "Spring 2026", gpa: 3.45 },
];

export function GPATrendChart() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">GPA Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={GPA_TREND_DATA}>
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
          />
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="#0891b2"
            strokeWidth={2}
            dot={{ fill: "#0891b2", r: 6 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
