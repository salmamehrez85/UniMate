import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CourseList({ courses }) {
  const { t } = useTranslation();
  if (courses.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-teal-500" />
        <h2 className="text-base font-bold text-primary-900">{t("schedule.courseList.title")}</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {courses.map((course) => (
          <div
            key={course._id}
            className="py-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {course.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{course.code}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {course.schedule ? (
                <p className="text-xs text-gray-500">{course.schedule}</p>
              ) : (
                <p className="text-xs text-gray-300 italic">{t("schedule.courseList.noSchedule")}</p>
              )}
              {course.instructor && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {course.instructor}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
