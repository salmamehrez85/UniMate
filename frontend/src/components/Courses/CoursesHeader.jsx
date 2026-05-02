import { Calendar, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CoursesHeader({ totalCourses, coursesLabel, onAddCourse }) {
  const { t } = useTranslation();

  function getCurrentSemester() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    let season;
    if (month >= 3 && month <= 5) season = t("courses.seasons.spring");
    else if (month >= 6 && month <= 9) season = t("courses.seasons.summer");
    else if (month >= 10 && month <= 11) season = t("courses.seasons.autumn");
    else season = t("courses.seasons.winter");
    return t("courses.seasons.semester", { season, year });
  }

  const currentSemester = getCurrentSemester();
  const labelText = coursesLabel || t("courses.header.activeLabel");

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-700">{currentSemester}</h1>
        <p className="text-gray-600 mt-1 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {totalCourses} {labelText}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onAddCourse}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-all font-semibold">
          <Plus className="w-5 h-5" />
          {t("courses.header.addCourse")}
        </button>
      </div>
    </div>
  );
}
