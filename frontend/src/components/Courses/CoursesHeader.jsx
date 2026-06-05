import { Calendar, Plus, BookOpen } from "lucide-react";
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
    <div className="page-hero">
      {/* Blobs */}
      <div className="page-hero-blob page-hero-blob-1" />
      <div className="page-hero-blob page-hero-blob-2" />
      <div className="page-hero-blob page-hero-blob-3" />

      <div className="page-hero-content flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="page-hero-label">
            <span className="page-hero-label-dot" />
            <BookOpen style={{ width: "0.85rem", height: "0.85rem" }} />
            {t("nav.courses")}
          </div>
          <h1 className="page-hero-title">{currentSemester}</h1>
          <p className="page-hero-subtitle flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0 text-black/70" />
            {totalCourses} {labelText}
          </p>
        </div>

        <button onClick={onAddCourse} className="btn-hero self-start shrink-0">
          <Plus style={{ width: "1rem", height: "1rem" }} />
          {t("courses.header.addCourse")}
        </button>
      </div>
    </div>
  );
}
