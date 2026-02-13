const UPCOMING_TASKS = [
  {
    id: 1,
    title: "Submit Math Assignment",
    course: "Mathematics",
    dueDate: "Today",
    priority: "high",
  },
  {
    id: 2,
    title: "Read Chapter 5",
    course: "Physics",
    dueDate: "Tomorrow",
    priority: "medium",
  },
  {
    id: 3,
    title: "Prepare Presentation",
    course: "Computer Science",
    dueDate: "Feb 15",
    priority: "high",
  },
];

function TaskItem({ task }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
      <input
        type="checkbox"
        className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
      />
      <div className="flex-1">
        <h4 className="font-semibold text-primary-900">{task.title}</h4>
        <p className="text-sm text-gray-600 mt-0.5">{task.course}</p>
        <div className="flex items-center gap-2 mt-2.5">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              task.priority === "high"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}>
            {task.priority}
          </span>
          <span className="text-xs text-gray-500">📅 {task.dueDate}</span>
        </div>
      </div>
    </div>
  );
}

export function UpcomingTasks() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-primary-900">Upcoming Tasks</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {UPCOMING_TASKS.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
