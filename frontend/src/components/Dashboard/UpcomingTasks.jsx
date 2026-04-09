import { ListTodo } from "lucide-react";

function getDaysLeftText(daysLeft) {
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
}

function TaskItem({ task }) {
  return (
    <div className="flex items-start gap-3 p-5 rounded-lg hover:bg-primary-50 transition-all border border-gray-100 hover:border-primary-200">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-base">{task.title}</h4>
        <p className="text-sm text-gray-500 mt-1.5">{task.course}</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              task.priority === "high"
                ? "bg-red-100 text-red-700 font-semibold"
                : "bg-amber-100 text-amber-700"
            }`}>
            {task.priority === "high" ? "• High " : "Medium"}
          </span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">
            {getDaysLeftText(task.daysLeft)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function UpcomingTasks({ tasks = [], loading = false }) {
  return (
    <div className="bg-white rounded-lg p-7 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-7">
        <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          Upcoming Tasks
        </h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-lg animate-pulse"
            />
          ))
        ) : tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No upcoming tasks. You&apos;re all caught up!
          </p>
        ) : (
          tasks.map((task) => <TaskItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
