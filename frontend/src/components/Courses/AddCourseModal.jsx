import { useState } from "react";
import { X } from "lucide-react";

export function AddCourseModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    instructor: "",
    schedule: "",
    credits: "",
    semester: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.code || !formData.name) {
      setError("Course code and name are required");
      return;
    }

    setLoading(true);

    try {
      await onAdd(formData);
      // Reset form
      setFormData({
        code: "",
        name: "",
        instructor: "",
        schedule: "",
        credits: "",
        semester: "",
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add course");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Add New Course</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Course Code */}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="e.g., CS 301"
              disabled={loading}
            />
          </div>

          {/* Course Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="e.g., Data Structures"
              disabled={loading}
            />
          </div>

          {/* Instructor */}
          <div>
            <label
              htmlFor="instructor"
              className="block text-sm font-medium text-gray-700 mb-2">
              Instructor
            </label>
            <input
              id="instructor"
              name="instructor"
              type="text"
              value={formData.instructor}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="e.g., John Doe"
              disabled={loading}
            />
          </div>

          {/* Schedule */}
          <div>
            <label
              htmlFor="schedule"
              className="block text-sm font-medium text-gray-700 mb-2">
              Schedule
            </label>
            <input
              id="schedule"
              name="schedule"
              type="text"
              value={formData.schedule}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="e.g., Mon & Wed 10:00 AM"
              disabled={loading}
            />
          </div>

          {/* Credits */}
          <div>
            <label
              htmlFor="credits"
              className="block text-sm font-medium text-gray-700 mb-2">
              Credits
            </label>
            <input
              id="credits"
              name="credits"
              type="text"
              value={formData.credits}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="e.g., 3"
              disabled={loading}
            />
          </div>

          {/* Semester */}
          <div>
            <label
              htmlFor="semester"
              className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <input
              id="semester"
              name="semester"
              type="text"
              value={formData.semester}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="e.g., Spring 2024"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}>
              {loading ? "Adding..." : "Add Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
