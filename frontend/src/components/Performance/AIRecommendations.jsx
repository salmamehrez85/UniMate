import { Lightbulb } from "lucide-react";

export function AIRecommendations() {
  const recommendations = [
    {
      id: 1,
      course: "PHYS 101",
      color: "bg-red-500",
      message:
        "Focus on completing lab reports on time. Your assignment completion rate is below 70%.",
    },
    {
      id: 2,
      course: "MATH 202",
      color: "bg-yellow-500",
      message:
        "Review integration techniques. Quiz results show this as a weak area.",
    },
    {
      id: 3,
      course: "CS 301",
      color: "bg-emerald-500",
      message:
        "Excellent progress. Continue practicing algorithm implementation.",
    },
  ];

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-100 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">
          AI Recommendations
        </h3>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="flex gap-3">
            <div
              className={`w-2 h-2 ${rec.color} rounded-full mt-2 flex-shrink-0`}></div>
            <div>
              <p className="font-semibold text-gray-900">{rec.course}</p>
              <p className="text-sm text-gray-600">{rec.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
