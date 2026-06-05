import { Calendar, Mail, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CourseCard({ course, onManage, onEmail }) {
  const { t } = useTranslation();

  const getCodeGradient = (code) => {
    const gradients = [
      "from-blue-600 to-cyan-500 shadow-blue-500/20",
      "from-purple-600 to-pink-500 shadow-purple-500/20",
      "from-teal-600 to-emerald-500 shadow-teal-500/20",
      "from-indigo-600 to-violet-500 shadow-indigo-500/20",
      "from-orange-600 to-amber-500 shadow-orange-500/20",
      "from-rose-600 to-pink-500 shadow-rose-500/20",
    ];
    const hash = code
      ? code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : 0;
    return gradients[hash % gradients.length];
  };

  const tasksCount = (course.tasks || []).length;

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-white/20 dark:border-white/5 shadow-md hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300">
      {/* Card Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/30">
        <div className="flex items-center gap-2">
          <span
            className={`bg-gradient-to-r ${getCodeGradient(course.code)} text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs tracking-wide uppercase`}>
            {course.code}
          </span>
          {course.isOldCourse && (
            <span className="bg-slate-400/80 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg dark:bg-slate-700/80">
              {t("courses.card.oldCourse")}
            </span>
          )}
        </div>
        <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/30">
          {t("courses.card.tasks", { count: tasksCount })}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-4 flex-1">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug tracking-tight">
          {course.name || course.title}
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400 text-sm">
            <span className="w-6 h-6 rounded-md bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
              <User className="w-3.5 h-3.5" />
            </span>
            <span className="font-medium truncate">
              {course.instructor || t("courses.card.notSpecified")}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400 text-sm">
            <span className="w-6 h-6 rounded-md bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span className="font-medium truncate">
              {course.schedule || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/20 border-t border-slate-100/50 dark:border-slate-800/30 flex items-center gap-2.5">
        <button
          onClick={onManage}
          className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 hover:from-indigo-600 hover:to-violet-600 text-indigo-600 hover:text-white dark:text-indigo-400 dark:hover:text-white font-semibold text-sm transition-all duration-300 rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 dark:hover:shadow-none border border-indigo-100/50 hover:border-transparent dark:border-indigo-900/40 cursor-pointer">
          {t("courses.card.manage")}
        </button>
        <button
          type="button"
          onClick={() => onEmail?.(course)}
          title={t("courses.card.generateEmail")}
          className="p-2.5 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 rounded-xl hover:scale-105 cursor-pointer">
          <Mail className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
