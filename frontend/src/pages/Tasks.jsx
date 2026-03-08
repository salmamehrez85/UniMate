import { useEffect, useMemo, useState } from "react";
import { TasksHeader } from "../components/Tasks/TasksHeader";
import { TasksSummary } from "../components/Tasks/TasksSummary";
import { TasksFilters } from "../components/Tasks/TasksFilters";
import { TasksList } from "../components/Tasks/TasksList";
import { getCourses, updateCourse } from "../services/courseService";
import { getDaysUntil } from "../components/Tasks/taskUtils";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "doing", label: "In Progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function Tasks() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

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
      <TasksHeader />

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
          updatingTaskId={updatingTaskId}
        />
      </div>
    </div>
  );
}
