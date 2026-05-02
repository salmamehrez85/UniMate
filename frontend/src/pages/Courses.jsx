import { useState, useEffect } from "react";
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
      <div className="space-y-6 mt-20 px-6 pb-24 md:pb-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">{t("courses.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-20 px-6 pb-24 md:pb-6">
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setViewMode("active")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            viewMode === "active"
              ? "bg-teal-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}>
          {t("courses.active", { count: activeCourses.length })}
        </button>
        <button
          onClick={() => setViewMode("completed")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            viewMode === "completed"
              ? "bg-teal-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}>
          {t("courses.completed", { count: completedCourses.length })}
        </button>
      </div>

      {/* Courses Grid */}
      {displayedCourses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-600 mb-4">
            {viewMode === "completed"
              ? t("courses.noCompleted")
              : t("courses.noActive")}
          </p>
          {viewMode === "active" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition font-semibold">
              {t("courses.addFirst")}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {semesterGroups.map(([semester, semesterCourses]) => (
            <section key={semester} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {semester}
                </h2>
                <span className="text-sm text-gray-500">
                  {semesterCourses.length} course
                  {semesterCourses.length === 1 ? "" : "s"}
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
          ))}
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
