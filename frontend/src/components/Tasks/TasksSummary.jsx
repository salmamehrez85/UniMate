export function TasksSummary({ summary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm text-gray-500">Total Tasks</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{summary.total}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm text-gray-500">Due Soon (7 days)</p>
        <p className="text-2xl font-bold text-amber-600 mt-2">
          {summary.dueSoon}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm text-gray-500">Overdue</p>
        <p className="text-2xl font-bold text-red-600 mt-2">
          {summary.overdue}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm text-gray-500">Completed</p>
        <p className="text-2xl font-bold text-emerald-600 mt-2">
          {summary.done}
        </p>
      </div>
    </div>
  );
}
