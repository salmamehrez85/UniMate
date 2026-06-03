import { Calendar, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CourseCard({ course, onManage, onEmail }) {
  const { t } = useTranslation();
  const getCodeBgColor = (code) => {
    const colors = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-teal-600",
      "bg-indigo-600",
      "bg-orange-600",
      "bg-pink-600",
      "bg-green-600",
      "bg-red-600",
      "bg-yellow-600",
      "bg-cyan-600",
    ];
    const hash = code
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const tasksCount = (course.tasks || []).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="p-5 flex items-start justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span
            className={`${getCodeBgColor(course.code)} text-white text-sm font-semibold px-3 py-1 rounded-lg`}>
            {course.code}
          </span>
          {course.isOldCourse && (
            <span className="bg-gray-400 text-white text-xs font-semibold px-3 py-1 rounded-lg">
              {t("courses.card.oldCourse")}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-sm font-medium">
          {t("courses.card.tasks", { count: tasksCount })}
        </span>
      </div>

      <div className="p-6 space-y-3">
        <h3 className="text-lg font-bold text-gray-900">
          {course.name || course.title}
        </h3>
        <p className="text-gray-600 text-sm">
          {course.instructor || t("courses.card.notSpecified")}
        </p>
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar className="w-4 h-4" />
          {course.schedule || "N/A"}
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={onManage}
          className="flex-1 text-center px-4 py-2 bg-white border border-gray-200 text-primary-600 hover:text-primary-700 hover:bg-gray-50 hover:border-gray-300 font-medium text-sm transition-all duration-200 rounded-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
          {t("courses.card.manage")}
        </button>
        <button
          type="button"
          onClick={() => onEmail?.(course)}
          title={t("courses.card.generateEmail")}
          className="px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
          <Mail className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
