import { useState, useEffect } from "react";
import { CoursesHeader } from "../components/Courses/CoursesHeader";
import { CourseCard } from "../components/Courses/CourseCard";
import { AddCourseModal } from "../components/Courses/AddCourseModal";
import { getCourses, createCourse } from "../services/courseService";

export function Courses({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("active");

  const activeCourses = courses.filter((course) => course.isOldCourse !== true);
  const completedCourses = courses.filter(
    (course) => course.isOldCourse === true,
  );
  const displayedCourses =
    viewMode === "completed" ? completedCourses : activeCourses;
  const coursesLabel =
    viewMode === "completed" ? "completed courses" : "active courses";

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

  if (loading) {
    return (
      <div className="space-y-6 mt-20 px-6 pb-24 md:pb-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading courses...</div>
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
          Active ({activeCourses.length})
        </button>
        <button
          onClick={() => setViewMode("completed")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            viewMode === "completed"
              ? "bg-teal-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}>
          Completed ({completedCourses.length})
        </button>
      </div>

      {/* Courses Grid */}
      {displayedCourses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-600 mb-4">
            {viewMode === "completed"
              ? "No completed courses yet"
              : "No active courses yet"}
          </p>
          {viewMode === "active" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition font-semibold">
              Add Your First Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCourses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onManage={() => onSelectCourse(course)}
            />
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCourse}
      />
    </div>
  );
}
