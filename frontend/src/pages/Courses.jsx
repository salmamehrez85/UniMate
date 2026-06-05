import { useState, useEffect } from "react";
import { Calendar, Plus } from "lucide-react";
import { CoursesHeader } from "../components/Courses/CoursesHeader";
import { CourseCard } from "../components/Courses/CourseCard";
import { AddCourseModal } from "../components/Courses/AddCourseModal";
import { GenerateEmailModal } from "../components/Courses/GenerateEmailModal";
import { getCourses, createCourse } from "../services/courseService";
import { getUserData } from "../services/authService";
import { useTranslation } from "react-i18next";

export function Courses({ onSelectCourse }) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailCourse, setEmailCourse] = useState(null);
  const [viewMode, setViewMode] = useState("active");

  const activeCourses = courses.filter((course) => course.isOldCourse !== true);
  const completedCourses = courses.filter(
    (course) => course.isOldCourse === true,
  );
  const displayedCourses =
    viewMode === "completed" ? completedCourses : activeCourses;
  const coursesLabel =
    viewMode === "completed"
      ? t("courses.header.completedLabel")
      : t("courses.header.activeLabel");

  const getSemesterSortKey = (semester) => {
    if (!semester) return { year: 0, season: 0 };
    const match = String(semester).match(
      /(Winter|Spring|Summer|Fall)\s+(\d{4})/i,
    );
    if (!match) return { year: 0, season: 0 };
    const seasonOrder = { winter: 0, spring: 1, summer: 2, fall: 3 };
    return {
      year: parseInt(match[2], 10),
      season: seasonOrder[match[1].toLowerCase()] ?? 0,
    };
  };

  const semesterGroups = Object.entries(
    displayedCourses.reduce((acc, course) => {
      const semesterKey = course.semester || "Unknown Semester";
      if (!acc[semesterKey]) {
        acc[semesterKey] = [];
      }
      acc[semesterKey].push(course);
      return acc;
    }, {}),
  ).sort(([aSemester], [bSemester]) => {
    const aKey = getSemesterSortKey(aSemester);
    const bKey = getSemesterSortKey(bSemester);
    if (aKey.year !== bKey.year) return aKey.year - bKey.year;
    return aKey.season - bKey.season;
  });

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data.courses || []);
      setError("");
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (courseData) => {
    try {
      const response = await createCourse(courseData);
      setCourses([response.course, ...courses]);
      return response.course;
    } catch (err) {
      throw err; // Let modal handle the error
    }
  };

  const handleCourseUpdate = (updatedCourse) => {
    setCourses(
      courses.map((c) => (c._id === updatedCourse._id ? updatedCourse : c)),
    );
  };

  const handleCourseDelete = (courseId) => {
    setCourses(courses.filter((c) => c._id !== courseId));
  };

  const handleOpenEmailModal = (course) => {
    setEmailCourse(course);
    setIsEmailModalOpen(true);
  };

  const currentUser = getUserData();

  if (loading) {
    return (
      <div className="space-y-6 px-6 pb-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">{t("courses.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 pb-6">
      <CoursesHeader
        totalCourses={
          viewMode === "completed"
            ? completedCourses.length
            : activeCourses.length
        }
        coursesLabel={coursesLabel}
        onAddCourse={() => setIsModalOpen(true)}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Glassy Tab Switcher */}
      <div className="glass-card p-1 rounded-2xl flex gap-1 w-fit border border-white/20 dark:border-white/5 shadow-xs">
        <button
          onClick={() => setViewMode("active")}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
            viewMode === "active"
              ? "bg-gradient-to-r from-indigo-400 to-violet-500 text-white shadow-md shadow-indigo-200/50 dark:shadow-none"
              : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5"
          }`}>
          {t("courses.active", { count: activeCourses.length })}
        </button>
        <button
          onClick={() => setViewMode("completed")}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
            viewMode === "completed"
              ? "bg-gradient-to-r from-indigo-400 to-violet-500 text-white shadow-md shadow-indigo-200/50 dark:shadow-none"
              : "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5"
          }`}>
          {t("courses.completed", { count: completedCourses.length })}
        </button>
      </div>

      {/* Courses Grid / Empty State */}
      {displayedCourses.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center border border-white/20 dark:border-white/5 shadow-md">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 mx-auto mb-4 border border-indigo-100/30">
            <Calendar className="w-8 h-8" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
            {viewMode === "completed"
              ? t("courses.noCompleted")
              : t("courses.noActive")}
          </p>
          {viewMode === "active" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-hero cursor-pointer inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("courses.addFirst")}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {semesterGroups.map(([semester, semesterCourses]) => {
            const semesterMatch = String(semester).match(
              /(Winter|Spring|Summer|Fall)\s+(\d{4})/i,
            );
            const seasonKeyMap = {
              winter: "courses.seasons.winter",
              spring: "courses.seasons.spring",
              summer: "courses.seasons.summer",
              fall: "courses.seasons.autumn",
            };
            const translatedSemester = semesterMatch
              ? t("courses.seasons.semester", {
                  season: t(
                    seasonKeyMap[semesterMatch[1].toLowerCase()] ||
                      semesterMatch[1],
                  ),
                  year: semesterMatch[2],
                })
              : semester;
            return (
              <section key={semester} className="space-y-6">
                <div className="section-title">
                  <div className="section-title-icon">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-gradient-brand font-extrabold tracking-tight">{translatedSemester}</h2>
                  <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30 shadow-xs">
                    {t("courses.groupCount", { count: semesterCourses.length })}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {semesterCourses.map((course) => (
                    <CourseCard
                      key={course._id}
                      course={course}
                      onManage={() => onSelectCourse(course)}
                      onEmail={handleOpenEmailModal}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCourse}
      />

      <GenerateEmailModal
        key={`${isEmailModalOpen}-${emailCourse?._id || "none"}`}
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        courses={activeCourses}
        selectedCourse={emailCourse}
        studentName={currentUser?.fullName || currentUser?.name || ""}
      />
    </div>
  );
}
