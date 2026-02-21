import { useState } from "react";
import { Save, X } from "lucide-react";
import { deleteCourse } from "../../services/courseService";

export function SettingsTab({
  course,
  onCourseUpdate,
  onCourseDelete,
  onBack,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    code: course.code || "",
    name: course.name || course.title || "",
    instructor: course.instructor || "",
    schedule: course.schedule || "",
    credits: course.credits || "",
    semester: course.semester || "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      setError("Course code and name are required");
      return;
    }

    const updatedCourse = {
      ...course,
      ...formData,
    };

    onCourseUpdate(updatedCourse);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(course._id);
      onCourseDelete(course._id);
      onBack();
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course: " + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Edit Course Section */}
      <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary-900">Edit Course</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
              Edit Course
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., CS101"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Introduction to Computer Science"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  placeholder="e.g., Dr. John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  placeholder="e.g., Mon & Wed 10:00 AM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credits
                </label>
                <input
                  type="text"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  placeholder="e.g., 3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  placeholder="e.g., Spring 2024"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
                <Save className="w-5 h-5" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    code: course.code || "",
                    name: course.name || course.title || "",
                    instructor: course.instructor || "",
                    schedule: course.schedule || "",
                    credits: course.credits || "",
                    semester: course.semester || "",
                  });
                  setError("");
                }}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Course Code
              </p>
              <p className="text-lg font-semibold text-primary-900">
                {course.code}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Course Name
              </p>
              <p className="text-lg font-semibold text-primary-900">
                {course.name || course.title}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Instructor
              </p>
              <p className="text-lg font-semibold text-primary-900">
                {course.instructor || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Schedule</p>
              <p className="text-lg font-semibold text-primary-900">
                {course.schedule || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Credits</p>
              <p className="text-lg font-semibold text-primary-900">
                {course.credits || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Semester</p>
              <p className="text-lg font-semibold text-primary-900">
                {course.semester || "Not specified"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Course Section - Danger Zone */}
      <div className="bg-red-50 rounded-xl p-8 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-2">Danger Zone</h2>
        <p className="text-red-700 mb-6">
          Once you delete a course, there is no going back. Please be certain.
        </p>

        <button
          onClick={() => setDeleteConfirm(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
          Delete Course
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-primary-900 mb-2">
              Delete Course?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{course.name || course.title}"?
              This action will also delete all assessments, tasks, and project
              phases associated with this course. This cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                Yes, Delete Course
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
