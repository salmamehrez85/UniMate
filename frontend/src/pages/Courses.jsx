import { useState, useEffect } from "react";
import { CoursesHeader } from "../components/Courses/CoursesHeader";
import { CourseCard } from "../components/Courses/CourseCard";
import { AddCourseModal } from "../components/Courses/AddCourseModal";
import { getCourses, createCourse } from "../services/courseService";

export function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data.courses);
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
      // Add new course to the list
      setCourses([response.course, ...courses]);
    } catch (err) {
      throw err; // Let modal handle the error
    }
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
        totalCourses={courses.length}
        onAddCourse={() => setIsModalOpen(true)}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-600 mb-4">No courses added yet</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition font-semibold">
            Add Your First Course
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
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
