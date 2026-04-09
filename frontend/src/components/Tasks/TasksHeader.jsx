import { ListTodo, Plus } from "lucide-react";

export function TasksHeader({ onAddTask }) {
  return (
    <div className="bg-linear-to-br from-teal-50 via-white to-cyan-50 rounded-2xl border border-teal-100 p-8 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-teal-600">
            <ListTodo className="w-5 h-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              Tasks Hub
            </p>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Stay ahead of every deadline
          </h1>
          <p className="text-gray-600 max-w-2xl">
            This view collects all active course tasks in one place. Update
            status, track overdue items, and search across courses instantly.
          </p>
        </div>

        <button
          onClick={onAddTask}
          className="self-start flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 active:scale-95 transition-all cursor-pointer shadow-sm shrink-0">
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>
    </div>
  );
}
