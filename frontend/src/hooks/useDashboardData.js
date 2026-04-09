import { useState, useEffect } from "react";
import { getCourses } from "../services/courseService";
import { getUserData } from "../services/authService";
import { CheckCircle2, BookOpen, FileText, TrendingUp } from "lucide-react";

const COURSE_COLORS = [
  "bg-blue-500",
  "bg-teal-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function calcCourseProgress(course) {
  const assessments = (course.assessments || []).filter(
    (a) => a.score != null && a.maxScore,
  );
  if (assessments.length > 0) {
    const avg =
      assessments.reduce((s, a) => s + (a.score / a.maxScore) * 100, 0) /
      assessments.length;
    return Math.round(avg);
  }
  const tasks = course.tasks || [];
  if (tasks.length > 0) {
    const done = tasks.filter((t) => t.status === "done").length;
    return Math.round((done / tasks.length) * 100);
  }
  return 0;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

function buildRecentActivity(courses) {
  const items = [];

  courses.forEach((course) => {
    const courseName = course.name || course.code;

    // Scored assessments → activity
    (course.assessments || []).forEach((a) => {
      if (a.score != null && a.date) {
        const pct = Math.round((a.score / (a.maxScore || 100)) * 100);
        const isQuiz = a.type === "quiz";
        items.push({
          id: `assessment-${course._id}-${a.id}`,
          title: `${isQuiz ? "Completed Quiz" : "Scored on " + a.title}: ${a.title}`,
          subtitle: `${courseName} • ${timeAgo(a.date)}`,
          badge: `${pct}%`,
          badgeColor: pct >= 80 ? "text-emerald-600" : "text-amber-600",
          bgColor: isQuiz ? "bg-emerald-100" : "bg-purple-100",
          Icon: isQuiz ? CheckCircle2 : FileText,
          iconColor: isQuiz ? "text-emerald-600" : "text-purple-600",
          _date: new Date(a.date),
        });
      }
    });

    // Done tasks → activity (use dueDate as proxy)
    (course.tasks || [])
      .filter((t) => t.status === "done" && t.dueDate)
      .forEach((t) => {
        items.push({
          id: `task-${course._id}-${t.id}`,
          title: `Completed: ${t.title}`,
          subtitle: `${courseName} • ${timeAgo(t.dueDate)}`,
          badge: null,
          bgColor: "bg-blue-100",
          Icon: BookOpen,
          iconColor: "text-primary-600",
          _date: new Date(t.dueDate),
        });
      });
  });

  // Sort by most recent, take top 5
  return items
    .sort((a, b) => b._date - a._date)
    .slice(0, 5)
    .map((item) => {
      const { _date, ...rest } = item;
      return rest;
    });
}

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    userName: "Student",
    tasksToday: 0,
    stats: {
      activeCourses: 0,
      pendingTasks: 0,
      avgPerformance: "—",
      studyHours: "—",
    },
    upcomingTasks: [],
    courseProgress: [],
    recentActivity: [],
  });

  useEffect(() => {
    async function load() {
      try {
        // User name from localStorage (already stored at login)
        const userData = getUserData();
        const fullName = userData?.fullName || "";
        const userName = fullName.split(" ")[0] || "Student";

        const result = await getCourses();
        const allCourses = result.courses || [];

        const activeCourses = allCourses.filter((c) => !c.isOldCourse);

        // ── Stats ──────────────────────────────────────────────
        const allActiveTasks = activeCourses.flatMap((c) => c.tasks || []);
        const pendingTasks = allActiveTasks.filter(
          (t) => t.status !== "done",
        ).length;
        const completedTasks = allActiveTasks.filter(
          (t) => t.status === "done",
        ).length;

        const allScoredAssessments = activeCourses.flatMap((c) =>
          (c.assessments || []).filter((a) => a.score != null && a.maxScore),
        );
        const avgPerformance =
          allScoredAssessments.length > 0
            ? Math.round(
                allScoredAssessments.reduce(
                  (s, a) => s + (a.score / a.maxScore) * 100,
                  0,
                ) / allScoredAssessments.length,
              ) + "%"
            : "—";

        // Study hours: completed tasks × 1.5h (rough estimate)
        const studyHours = completedTasks;

        // ── Upcoming Tasks ─────────────────────────────────────
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcomingRaw = [];
        activeCourses.forEach((c) => {
          (c.tasks || [])
            .filter((t) => t.status !== "done" && t.dueDate)
            .forEach((t) => {
              const due = new Date(t.dueDate);
              due.setHours(0, 0, 0, 0);
              const daysLeft = Math.round((due - now) / (1000 * 60 * 60 * 24));
              if (daysLeft >= 0) {
                upcomingRaw.push({
                  id: t.id || t._id,
                  title: t.title,
                  course: c.name || c.code,
                  daysLeft,
                  priority: t.priority || "medium",
                });
              }
            });
        });
        upcomingRaw.sort((a, b) => a.daysLeft - b.daysLeft);
        const upcomingTasks = upcomingRaw.slice(0, 4);

        // Tasks due today
        const tasksToday = upcomingRaw.filter((t) => t.daysLeft === 0).length;

        // ── Course Progress ────────────────────────────────────
        const courseProgress = activeCourses.slice(0, 4).map((c, i) => ({
          id: c._id,
          name: c.name || c.code,
          progress: calcCourseProgress(c),
          color: COURSE_COLORS[i % COURSE_COLORS.length],
        }));

        // ── Recent Activity ────────────────────────────────────
        const recentActivity = buildRecentActivity(allCourses);

        setData({
          userName,
          tasksToday,
          stats: {
            activeCourses: activeCourses.length,
            pendingTasks,
            avgPerformance,
            studyHours,
          },
          upcomingTasks,
          courseProgress,
          recentActivity,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { loading, error, ...data };
}
