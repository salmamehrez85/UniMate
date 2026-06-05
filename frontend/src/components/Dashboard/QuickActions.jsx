import { Plus, FileText, HelpCircle, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export function QuickActions({ onNavigate }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-4 pt-2 justify-center">
      <button
        onClick={() => onNavigate("courses")}
        className="flex items-center gap-2 text-white px-6 py-3.5 rounded-xl font-bold tracking-wide transition-all shadow-md hover:shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 hover:-translate-y-0.5 duration-200 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500">
        <BookOpen className="w-4.5 h-4.5" />
        {t("dashboard.quickActions.addCourse")}
      </button>
      <button
        onClick={() => onNavigate("tasks")}
        className="flex items-center gap-2 text-white px-6 py-3.5 rounded-xl font-bold tracking-wide transition-all shadow-md hover:shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 hover:-translate-y-0.5 duration-200 cursor-pointer bg-gradient-to-r from-indigo-500 to-violet-500">
        <Plus className="w-4.5 h-4.5" />
        {t("dashboard.quickActions.addTask")}
      </button>
      <button
        onClick={() => onNavigate("summarizer")}
        className="flex items-center gap-2 bg-white/70 dark:bg-[#161b22]/70 backdrop-blur-md hover:bg-gray-50/50 dark:hover:bg-[#1c2128]/70 text-gray-900 dark:text-white px-6 py-3.5 rounded-xl font-bold tracking-wide transition-all shadow-xs border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 active:scale-95 hover:-translate-y-0.5 duration-200 cursor-pointer">
        <FileText className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
        {t("dashboard.quickActions.summarize")}
      </button>
      <button
        onClick={() => onNavigate("quizzes")}
        className="flex items-center gap-2 bg-white/70 dark:bg-[#161b22]/70 backdrop-blur-md hover:bg-gray-50/50 dark:hover:bg-[#1c2128]/70 text-gray-900 dark:text-white px-6 py-3.5 rounded-xl font-bold tracking-wide transition-all shadow-xs border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 active:scale-95 hover:-translate-y-0.5 duration-200 cursor-pointer">
        <HelpCircle className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
        {t("dashboard.quickActions.takeQuiz")}
      </button>
    </div>
  );
}
