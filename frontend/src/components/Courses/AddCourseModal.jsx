import { useState } from "react";
import { X } from "lucide-react";

// Helper function to get current semester based on date
const getCurrentSemester = () => {
  const month = new Date().getMonth(); // 0-11
  const year = new Date().getFullYear();

  // Winter: January (0) - February (1)
  if (month >= 0 && month <= 2) return `Winter ${year}`;
  // Spring: March (2) - May (4)
  else if (month >= 3 && month <= 5) return `Spring ${year}`;
  // Summer: June (5) - August (7)
  else if (month >= 6 && month <= 8) return `Summer ${year}`;
  // Fall: 9 - 10 - 11
  else return `Fall ${year}`;
};

// Helper function to generate semester options for dropdown
const generateSemesterOptions = () => {
  const seasons = ["Winter", "Spring", "Summer", "Fall"];
  const currentYear = new Date().getFullYear();
  const currentSemester = getCurrentSemester();
  const options = [];

  // Generate options for: previous year, current year, and next year
  for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
    const year = currentYear + yearOffset;
    seasons.forEach((season) => {
      options.push({
        value: `${season} ${year}`,
        label: `${season} ${year}`,
      });
    });
  }

  // Sort by year and season order
  const seasonOrder = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };
  options.sort((a, b) => {
    const [aSeason, aYear] = a.value.split(" ");
    const [bSeason, bYear] = b.value.split(" ");
    const yearDiff = parseInt(aYear) - parseInt(bYear);
    if (yearDiff !== 0) return yearDiff;
    return seasonOrder[aSeason] - seasonOrder[bSeason];
  });

  return options;
};

export function AddCourseModal({ isOpen, onClose, onAdd }) {
  const semesterOptions = generateSemesterOptions();
  const currentSemester = getCurrentSemester();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    instructor: "",
    schedule: "",
    credits: "",
    semester: currentSemester, // Auto-select current semester
    outlineText: "",
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
        semester: currentSemester, // Reset to current semester
        outlineText: "",
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

          {/* Semester - Dropdown with validated options */}
          <div>
            <label
              htmlFor="semester"
              className="block text-sm font-medium text-gray-700 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              disabled={loading}>
              <option value="" disabled>
                Select a semester...
              </option>
              {semesterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Default: {currentSemester}
            </p>
          </div>

          {/* Course Outline / Syllabus */}
          <div>
            <label
              htmlFor="outlineText"
              className="block text-sm font-medium text-gray-700 mb-2">
              Course Outline / Syllabus
            </label>
            <textarea
              id="outlineText"
              name="outlineText"
              value={formData.outlineText}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
              placeholder="Paste the course syllabus or outline here... (helps AI make better predictions)"
              rows="4"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              This helps the AI predictor understand course content for better
              grade forecasts
            </p>
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
