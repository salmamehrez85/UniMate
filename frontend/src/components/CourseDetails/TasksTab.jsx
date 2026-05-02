import { useState } from "react";
import { Plus, Trash2, X, CheckCircle, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

function AddTaskModal({ isOpen, onClose, onAdd }) {
  const { t } = useTranslation();
  const TASK_STATUS = [
    { value: "todo", label: t("courseDetails.tasks.todo") },
    { value: "doing", label: t("courseDetails.tasks.inProgress") },
    { value: "done", label: t("courseDetails.tasks.done") },
  ];
  const TASK_PRIORITY = [
    {
      value: "low",
      label: t("courseDetails.tasks.low"),
      color: "bg-green-100 text-green-800",
    },
    {
      value: "medium",
      label: t("courseDetails.tasks.medium"),
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "high",
      label: t("courseDetails.tasks.high"),
      color: "bg-red-100 text-red-800",
    },
  ];
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    status: "todo",
    priority: "medium",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError(t("courseDetails.tasks.titleRequired"));
      return;
    }
    if (!formData.dueDate) {
      setError(t("courseDetails.tasks.dueDateRequired"));
      return;
    }

    onAdd({
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
    });

    setFormData({
      title: "",
      description: "",
      dueDate: "",
      dueTime: "",
      status: "todo",
      priority: "medium",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-primary-900">
            {t("courseDetails.tasks.addTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("courseDetails.tasks.titleLabel")} *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t("courseDetails.tasks.titlePlaceholder")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("courseDetails.tasks.descLabel")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t("courseDetails.tasks.descPlaceholder")}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("courseDetails.tasks.dueDateLabel")} *
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("courseDetails.tasks.dueTimeLabel")}
              </label>
              <input
                type="time"
                name="dueTime"
                value={formData.dueTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("courseDetails.tasks.statusLabel")} *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                {TASK_STATUS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("courseDetails.tasks.priorityLabel")} *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                {TASK_PRIORITY.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
              {t("courseDetails.tasks.addButton")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
              {t("courseDetails.tasks.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TasksTab({ course, onCourseUpdate }) {
  const { t } = useTranslation();
  const TASK_STATUS = [
    { value: "todo", label: t("courseDetails.tasks.todo") },
    { value: "doing", label: t("courseDetails.tasks.inProgress") },
    { value: "done", label: t("courseDetails.tasks.done") },
  ];
  const TASK_PRIORITY = [
    {
      value: "low",
      label: t("courseDetails.tasks.low"),
      color: "bg-green-100 text-green-800",
    },
    {
      value: "medium",
      label: t("courseDetails.tasks.medium"),
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "high",
      label: t("courseDetails.tasks.high"),
      color: "bg-red-100 text-red-800",
    },
  ];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const tasks = course.tasks || [];

  const filteredTasks = tasks.filter((task) =>
    filterStatus === "all" ? true : task.status === filterStatus,
  );

  const sortedTasks = [...filteredTasks].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
  );

  const handleAddTask = (newTask) => {
    const updated = {
      ...course,
      tasks: [newTask, ...tasks],
    };
    onCourseUpdate(updated);
    setIsModalOpen(false);
  };

  const handleStatusChange = (taskId, newStatus) => {
    const updated = {
      ...course,
      tasks: tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t,
      ),
    };
    onCourseUpdate(updated);
  };

  const handleDeleteTask = (id) => {
    const updated = {
      ...course,
      tasks: tasks.filter((t) => t.id !== id),
    };
    onCourseUpdate(updated);
    setDeleteConfirm(null);
  };

  const getStatusLabel = (status) => {
    const found = TASK_STATUS.find((s) => s.value === status);
    return found ? found.label : status;
  };

  const getPriorityColor = (priority) => {
    const found = TASK_PRIORITY.find((p) => p.value === priority);
    return found ? found.color : "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "all"
                ? "bg-teal-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            {t("courseDetails.tasks.all")}
          </button>
          {TASK_STATUS.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === status.value
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
              {status.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition whitespace-nowrap">
          <Plus className="w-5 h-5" />
          {t("courseDetails.tasks.addButton")}
        </button>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-600 mb-4">
            {filterStatus === "all"
              ? t("courseDetails.tasks.noTasksYet")
              : t("courseDetails.tasks.noStatusTasks", {
                  status: getStatusLabel(filterStatus).toLowerCase(),
                })}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
            {t("courseDetails.tasks.addFirstTask")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        handleStatusChange(
                          task.id,
                          task.status === "done" ? "todo" : "done",
                        )
                      }
                      className="text-gray-400 hover:text-teal-500 transition flex-shrink-0">
                      {task.status === "done" ? (
                        <CheckCircle className="w-6 h-6 text-teal-500" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${
                          task.status === "done"
                            ? "text-gray-400 line-through"
                            : "text-primary-900"
                        }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 ml-9">
                    <span className="text-sm text-gray-600">
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                      {task.dueTime && ` at ${task.dueTime}`}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                      {
                        TASK_PRIORITY.find((p) => p.value === task.priority)
                          ?.label
                      }
                    </span>
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteConfirm(task.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-primary-900 mb-4">
              {t("courseDetails.tasks.deleteTitle")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("courseDetails.tasks.deleteConfirm")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteTask(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
                {t("courseDetails.tasks.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTask}
      />
    </div>
  );
}
