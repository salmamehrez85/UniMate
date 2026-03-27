import { TrendingDown } from "lucide-react";

export function RecentResults({ results }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-primary-900">Recent Results</h2>
      </div>

      {results.length === 0 && (
        <div className="px-6 py-10 text-sm text-gray-500">
          No submitted quiz results yet. Start a quiz and your weak areas will
          appear here.
        </div>
      )}

      {results.length > 0 && (
        <div className="divide-y divide-gray-100">
          {results.map((result) => (
            <div key={result.id} className="px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {result.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.course} • {result.date}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      result.score >= 85
                        ? "text-emerald-600"
                        : result.score >= 70
                          ? "text-yellow-600"
                          : "text-orange-600"
                    }`}>
                    {result.score}/100
                  </p>
                  <p className="text-sm text-gray-500">{result.score}%</p>
                </div>
              </div>

              {result.weakAreas.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-red-700 text-sm font-semibold">
                    <TrendingDown className="w-4 h-4" />
                    Weak Areas
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.weakAreas.map((area) => (
                      <span
                        key={area}
                        className="text-xs text-red-700 bg-white border border-red-200 px-2 py-1 rounded-md">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
