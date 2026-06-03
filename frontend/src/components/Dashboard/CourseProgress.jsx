import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

function CourseItem({ course }) {
  return (
    <div className="pb-1">
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-bold text-gray-900 text-sm">
          {course.name}
        </span>
        <span className="text-xs font-extrabold text-primary-700 bg-primary-50/70 border border-primary-100/50 px-2 py-0.5 rounded">
          {course.progress}%
        </span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${course.color} h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-teal-400`}
          style={{ width: `${course.progress}%` }}
        />
      </div>
    </div>
  );
}

export function CourseProgress({ courses = [], loading = false }) {
  const { t } = useTranslation();
  return (
    <div className="glass-card rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-extrabold text-primary-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          {t("dashboard.courseProgress.title")}
        </h3>
      </div>
      <div className="space-y-5">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded-lg animate-pulse"
            />
          ))
        ) : courses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            {t("dashboard.courseProgress.empty")}
          </p>
        ) : (
          courses.map((course) => (
            <CourseItem key={course.id} course={course} />
          ))
        )}
      </div>
    </div>
  );
}
