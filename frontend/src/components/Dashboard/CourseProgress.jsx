import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

function CourseItem({ course }) {
  return (
    <div className="pb-1">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-800 text-sm">{course.name}</span>
        <span
          className="text-xs font-extrabold px-2 py-0.5 rounded-lg"
          style={{
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            border: "1px solid rgba(99,102,241,0.2)",
            padding: "2px 8px",
          }}
        >
          {course.progress}%
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${course.progress}%`,
            background:
              "linear-gradient(to right, #4f46e5, #7c3aed, #a855f7)",
            boxShadow: "0 0 8px rgba(99,102,241,0.4)",
          }}
        />
      </div>
    </div>
  );
}

export function CourseProgress({ courses = [], loading = false }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card rounded-2xl p-6 shadow-xs">
      {/* Section title */}
      <div className="section-title">
        <div className="section-title-icon">
          <BookOpen />
        </div>
        <span className="text-gradient-brand">
          {t("dashboard.courseProgress.title")}
        </span>
      </div>

      <div className="space-y-5">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-indigo-50/40 rounded-lg animate-pulse" />
          ))
        ) : courses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {t("dashboard.courseProgress.empty")}
          </p>
        ) : (
          courses.map((course) => <CourseItem key={course.id} course={course} />)
        )}
      </div>
    </div>
  );
}
