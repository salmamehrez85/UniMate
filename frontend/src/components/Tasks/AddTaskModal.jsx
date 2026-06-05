import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "../ui/CustomSelect";

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

  // Disable body scroll when modal is open (mounted)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg max-w-md lg:max-w-lg w-full p-6 md:p-8 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary-900">
            {t("tasks.addModal.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("tasks.addModal.titleLabel")}
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
            {t("tasks.addModal.courseLabel")}
          </label>
          <CustomSelect
            name="courseId"
            value={form.courseId}
            onChange={handleChange}
            options={courses.map((c) => ({
              value: c._id,
              label: c.code ? `${c.code} – ${c.name}` : c.name,
            }))}
            buttonClassName="h-[58px]"
          />
        </div>

        {/* Due Date + Due Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tasks.addModal.dueDateLabel")}
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
              {t("tasks.addModal.statusLabel")}
            </label>
            <CustomSelect
              name="status"
              value={form.status}
              onChange={handleChange}
              options={STATUS_OPTIONS}
              buttonClassName="h-[58px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("tasks.addModal.priorityLabel")}
            </label>
            <CustomSelect
              name="priority"
              value={form.priority}
              onChange={handleChange}
              options={PRIORITY_OPTIONS}
              getDescription={(value) => {
                const descriptions = {
                  high: "Urgent, do first",
                  medium: "Normal priority",
                  low: "Can wait",
                };
                return descriptions[value] || "";
              }}
              buttonClassName="h-[58px]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-400 to-violet-500 hover:via-purple-500/60 hover:to-blue-500/60 cursor-pointer text-white rounded-lg font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting
              ? t("tasks.addModal.adding")
              : t("tasks.addModal.addButton")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition cursor-pointer cursor-pointer">
            {t("tasks.addModal.cancelButton")}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
