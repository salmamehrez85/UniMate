import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TasksHeader } from "../components/Tasks/TasksHeader";
import { TasksSummary } from "../components/Tasks/TasksSummary";
import { TasksFilters } from "../components/Tasks/TasksFilters";
import { TasksList } from "../components/Tasks/TasksList";
import { AddTaskModal } from "../components/Tasks/AddTaskModal";
import { getCourses, updateCourse } from "../services/courseService";
import { getDaysUntil } from "../components/Tasks/taskUtils";
import { useTranslation } from "react-i18next";

export function Tasks() {
  const { t } = useTranslation();

  const STATUS_OPTIONS = [
    { value: "all", label: t("tasks.status.all") },
    { value: "todo", label: t("tasks.status.todo") },
    { value: "done", label: t("tasks.status.done") },
  ];

  const PRIORITY_OPTIONS = [
    { value: "all", label: t("tasks.priority.all") },
    { value: "high", label: t("tasks.priority.high") },
    { value: "medium", label: t("tasks.priority.medium") },
    { value: "low", label: t("tasks.priority.low") },
  ];
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Active (non-old) courses available for the modal dropdown
  const activeCourses = useMemo(
    () => courses.filter((c) => c.isOldCourse !== true),
    [courses],
  );

  // Disable body scroll when delete modal is open
  useEffect(() => {
    if (deleteConfirmId) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [deleteConfirmId]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await getCourses();
        setCourses(data.courses || []);
        setError("");
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const tasks = useMemo(() => {
    return courses
      .filter((course) => course.isOldCourse !== true)
      .flatMap((course) =>
        (course.tasks || []).map((task) => ({
          ...task,
          courseId: course._id,
          courseName: course.name,
          courseCode: course.code,
          semester: course.semester,
        })),
      );
  }, [courses]);

  const summary = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "done").length;
    const overdue = tasks.filter((task) => {
      if (task.status === "done" || !task.dueDate) return false;
      return getDaysUntil(task.dueDate) < 0;
    }).length;
    const dueSoon = tasks.filter((task) => {
      if (task.status === "done" || !task.dueDate) return false;
      const daysLeft = getDaysUntil(task.dueDate);
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    return { total, done, overdue, dueSoon };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return tasks
      .filter((task) =>
        statusFilter === "all" ? true : task.status === statusFilter,
      )
      .filter((task) =>
        priorityFilter === "all" ? true : task.priority === priorityFilter,
      )
      .filter((task) => {
        if (!lowerQuery) return true;
        return (
          task.title?.toLowerCase().includes(lowerQuery) ||
          task.courseName?.toLowerCase().includes(lowerQuery) ||
          task.courseCode?.toLowerCase().includes(lowerQuery)
        );
      })
      .sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
  }, [tasks, statusFilter, priorityFilter, query]);

  const handleAddTask = async ({
    title,
    description,
    courseId,
    priority,
    dueDate,
    status,
  }) => {
    const course = courses.find((c) => c._id === courseId);
    if (!course) throw new Error("Course not found.");

    const newTask = {
      id: crypto.randomUUID(),
      title,
      description: description || null,
      status: status || "todo",
      priority,
      dueDate: dueDate || null,
    };

    const updatedCourse = {
      ...course,
      tasks: [...(course.tasks || []), newTask],
    };

    // Optimistic update
    setCourses((prev) =>
      prev.map((c) => (c._id === courseId ? updatedCourse : c)),
    );

    try {
      await updateCourse(courseId, updatedCourse);
    } catch (err) {
      // Roll back on failure
      setCourses((prev) => prev.map((c) => (c._id === courseId ? course : c)));
      throw err;
    }
  };

  const handleToggleStatus = async (task) => {
    if (!task?.courseId) return;
    const targetStatus = task.status === "done" ? "todo" : "done";
    setUpdatingTaskId(task.id);

    const course = courses.find((c) => c._id === task.courseId);
    if (!course) {
      setUpdatingTaskId(null);
      return;
    }

    const updatedTasks = (course.tasks || []).map((t) =>
      t.id === task.id ? { ...t, status: targetStatus } : t,
    );

    const updatedCourse = { ...course, tasks: updatedTasks };

    setCourses((prev) =>
      prev.map((c) => (c._id === course._id ? updatedCourse : c)),
    );

    try {
      await updateCourse(course._id, updatedCourse);
    } catch (err) {
      console.error("Failed to update task status:", err);
      setCourses((prev) =>
        prev.map((c) => (c._id === course._id ? course : c)),
      );
      setError(err.message || "Failed to update task status");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!task?.courseId) return;

    setUpdatingTaskId(task.id);

    const course = courses.find((c) => c._id === task.courseId);
    if (!course) {
      setUpdatingTaskId(null);
      return;
    }

    const updatedTasks = (course.tasks || []).filter((t) => t.id !== task.id);
    const updatedCourse = { ...course, tasks: updatedTasks };

    setCourses((prev) =>
      prev.map((c) => (c._id === course._id ? updatedCourse : c)),
    );

    try {
      await updateCourse(course._id, updatedCourse);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
      setCourses((prev) =>
        prev.map((c) => (c._id === course._id ? course : c)),
      );
      setError(err.message || "Failed to delete task");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-20">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Tasks</h2>
          <p className="text-neutral-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 space-y-6">
      <TasksHeader onAddTask={() => setShowAddModal(true)} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <TasksSummary summary={summary} />

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
        <TasksFilters
          statusOptions={STATUS_OPTIONS}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityOptions={PRIORITY_OPTIONS}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          query={query}
          onQueryChange={setQuery}
        />
        <TasksList
          tasks={filteredTasks}
          onToggleStatus={handleToggleStatus}
          onDeleteTask={handleDeleteTask}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          updatingTaskId={updatingTaskId}
        />
      </div>

      {showAddModal && activeCourses.length > 0 && (
        <AddTaskModal
          courses={activeCourses}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId &&
        createPortal(
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 overflow-hidden overflow-x-hidden">
            <div className="bg-white rounded-xl shadow-lg max-w-sm md:max-w-md w-full p-4 md:p-6 max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-primary-900 mb-2">
                {t("tasks.deleteTitle")}
              </h3>
              <p className="text-gray-600 mb-4">{t("tasks.deleteConfirm")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const task = filteredTasks.find(
                      (t) => t.id === deleteConfirmId,
                    );
                    if (task) handleDeleteTask(task);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition cursor-pointer">
                  {t("tasks.deleteButton")}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition cursor-pointer">
                  {t("tasks.cancel")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
