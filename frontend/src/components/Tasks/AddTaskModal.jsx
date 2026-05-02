import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AddTaskModal({ courses, onClose, onAdd }) {
  const { t } = useTranslation();

  const STATUS_OPTIONS = [
    { value: "todo", label: t("tasks.status.todo") },
    { value: "doing", label: t("tasks.status.doing") },
    { value: "done", label: t("tasks.status.done") },
  ];

  const PRIORITY_OPTIONS = [
    { value: "high", label: t("tasks.priority.high") },
    { value: "medium", label: t("tasks.priority.medium") },
    { value: "low", label: t("tasks.priority.low") },
  ];

  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: courses[0]?._id || "",
    dueDate: "",
    dueTime: "",
    status: "todo",
    priority: "medium",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError(t("tasks.addModal.titleRequired"));
      return;
    }
    if (!form.courseId) {
      setError(t("tasks.addModal.courseRequired"));
      return;
    }
    if (!form.dueDate) {
      setError(t("tasks.addModal.dueDateRequired"));
      return;
    }

    // Combine date + optional time into an ISO string
    const dueDate = form.dueTime
      ? new Date(`${form.dueDate}T${form.dueTime}`).toISOString()
      : new Date(form.dueDate).toISOString();

    setSubmitting(true);
    setError("");
    try {
      await onAdd({
        title: form.title.trim(),
        description: form.description.trim() || null,
        courseId: form.courseId,
        dueDate,
        status: form.status,
        priority: form.priority,
      });
      onClose();
    } catch (err) {
      setError(err.message || t("tasks.addModal.failedToAdd"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-primary-900">
            {t("tasks.addModal.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tasks.addModal.titleLabel")} *
            </label>
            <input
              ref={titleRef}
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={t("tasks.addModal.titlePlaceholder")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tasks.addModal.descriptionLabel")}
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t("tasks.addModal.descriptionPlaceholder")}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tasks.addModal.courseLabel")} *
            </label>
            <select
              name="courseId"
              value={form.courseId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code ? `${c.code} – ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date + Due Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tasks.addModal.dueDateLabel")} *
              </label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tasks.addModal.dueTimeLabel")}
              </label>
              <input
                type="time"
                name="dueTime"
                value={form.dueTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tasks.addModal.statusLabel")} *
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tasks.addModal.priorityLabel")} *
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting
                ? t("tasks.addModal.adding")
                : t("tasks.addModal.addButton")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition cursor-pointer">
              {t("tasks.addModal.cancelButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
