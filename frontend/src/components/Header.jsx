import { useState, useEffect, useRef } from "react";
import {
  Bell,
  LogOut,
  X,
  AlertCircle,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { getCourses } from "../services/courseService";
import { getNotificationPrefs } from "../hooks/useNotificationPrefs";

function buildNotifications(courses, prefs) {
  const items = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  courses.forEach((course) => {
    const name = course.name || course.code;

    // Assignment reminders — tasks due within 3 days
    if (prefs.assignments) {
      (course.tasks || [])
        .filter((t) => t.status !== "done" && t.dueDate)
        .forEach((t) => {
          const due = new Date(t.dueDate);
          due.setHours(0, 0, 0, 0);
          const daysLeft = Math.round((due - now) / 86400000);
          if (daysLeft >= 0 && daysLeft <= 3) {
            items.push({
              id: `task-${course._id}-${t.id}`,
              icon: AlertCircle,
              color: daysLeft === 0 ? "text-red-500" : "text-amber-500",
              bg: daysLeft === 0 ? "bg-red-50" : "bg-amber-50",
              title: t.title,
              subtitle: `${name} • ${daysLeft === 0 ? "Due today" : `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`}`,
            });
          }
        });
    }

    // Quiz availability — assessments of type quiz with no score yet
    if (prefs.quizzes) {
      (course.assessments || [])
        .filter((a) => a.type === "quiz" && a.score == null)
        .forEach((a) => {
          items.push({
            id: `quiz-${course._id}-${a.id}`,
            icon: BookOpen,
            color: "text-primary-600",
            bg: "bg-blue-50",
            title: `Quiz available: ${a.title}`,
            subtitle: name,
          });
        });
    }
  });

  // Performance update — show if avg < 70%
  if (prefs.performance) {
    const allScored = courses.flatMap((c) =>
      (c.assessments || []).filter((a) => a.score != null && a.maxScore),
    );
    if (allScored.length > 0) {
      const avg =
        allScored.reduce((s, a) => s + (a.score / a.maxScore) * 100, 0) /
        allScored.length;
      if (avg < 70) {
        items.push({
          id: "performance-summary",
          icon: TrendingUp,
          color: "text-teal-600",
          bg: "bg-teal-50",
          title: `Weekly performance: ${Math.round(avg)}% avg`,
          subtitle: "Consider reviewing lower-scored courses",
        });
      }
    }
  }

  return items;
}

export function Header({ activeView, onLogout }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissedNotifs") || "[]");
    } catch {
      return [];
    }
  });
  const panelRef = useRef(null);

  useEffect(() => {
    getCourses()
      .then(({ courses = [] }) => {
        const prefs = getNotificationPrefs();
        setNotifications(
          buildNotifications(
            courses.filter((c) => !c.isOldCourse),
            prefs,
          ),
        );
      })
      .catch(() => {});
  }, []);

  // Re-read prefs whenever panel is opened (picks up changes from Settings)
  useEffect(() => {
    if (!open) return;
    getCourses()
      .then(({ courses = [] }) => {
        const prefs = getNotificationPrefs();
        setNotifications(
          buildNotifications(
            courses.filter((c) => !c.isOldCourse),
            prefs,
          ),
        );
      })
      .catch(() => {});
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const visible = notifications.filter((n) => !dismissed.includes(n.id));

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("dismissedNotifs", JSON.stringify(next));
  };

  const getTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "Dashboard";
      case "courses":
        return "My Courses";
      case "tasks":
        return "Tasks";
      case "summarizer":
        return "Summarizer";
      case "quizzes":
        return "Quizzes";
      case "performance":
        return "Performance";
      case "chat":
        return "AI Chat";
      case "schedule":
        return "Schedule";
      case "email":
        return "Email Professor";
      case "settings":
        return "Settings";
      default:
        return "UniMate";
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-10 md:ml-64 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-700 text-left tracking-tight">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-4">
            {/* Bell with dropdown */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="relative p-2.5 hover:bg-gray-50 rounded-lg transition-colors text-primary-600 cursor-pointer">
                <Bell className="w-5 h-5" />
                {visible.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-800 text-sm">
                      Notifications
                    </span>
                    {visible.length > 0 && (
                      <span className="text-xs bg-primary-100 text-primary-700 font-semibold px-2 py-0.5 rounded-full">
                        {visible.length}
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {visible.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      visible.map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 ${n.bg}`}>
                          <div className={`mt-0.5 flex-shrink-0 ${n.color}`}>
                            <n.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 leading-snug">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.subtitle}
                            </p>
                          </div>
                          <button
                            onClick={() => dismiss(n.id)}
                            className="flex-shrink-0 text-gray-300 hover:text-gray-500 cursor-pointer transition-colors mt-0.5">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              className="p-2.5 hover:bg-red-50 rounded-lg transition-colors text-red-600 cursor-pointer"
              title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
