import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

// Helper function to get current semester based on date
const getCurrentSemester = () => {
  const month = new Date().getMonth(); // 0-11
  const year = new Date().getFullYear();

  // Winter: December (11) - February (1)
  if (month === 11 || month === 0 || month === 1) return `Winter ${year}`;
  // Spring: March (2) - May (4)
  if (month >= 2 && month <= 4) return `Spring ${year}`;
  // Summer: June (5) - August (7)
  if (month >= 5 && month <= 7) return `Summer ${year}`;
  // Fall: September (8) - November (10)
  return `Fall ${year}`;
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
  const { t } = useTranslation();
  const semesterOptions = generateSemesterOptions();
  const currentSemester = getCurrentSemester();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    instructor: "",
    schedule: "",
    location: "",
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
      setError(t("courses.addModal.codeNameRequired"));
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
        location: "",
        credits: "",
        semester: currentSemester, // Reset to current semester
        outlineText: "",
      });
      onClose();
    } catch (err) {
      setError(err.message || t("courses.addModal.failedToAdd"));
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
          <h2 className="text-xl font-bold text-gray-900">
            {t("courses.addModal.title")}
          </h2>
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
              {t("courses.addModal.codeLabel")}{" "}
              <span className="text-red-500">
                {t("courses.addModal.codeRequired")}
              </span>
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder={t("courses.addModal.codePlaceholder")}
              disabled={loading}
            />
          </div>

          {/* Course Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2">
              {t("courses.addModal.nameLabel")}{" "}
              <span className="text-red-500">
                {t("courses.addModal.codeRequired")}
              </span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder={t("courses.addModal.namePlaceholder")}
              disabled={loading}
            />
          </div>

          {/* Instructor */}
          <div>
            <label
              htmlFor="instructor"
              className="block text-sm font-medium text-gray-700 mb-2">
              {t("courses.addModal.instructorLabel")}
            </label>
            <input
              id="instructor"
              name="instructor"
              type="text"
              value={formData.instructor}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder={t("courses.addModal.instructorPlaceholder")}
              disabled={loading}
            />
          </div>

          {/* Schedule */}
          <div>
            <label
              htmlFor="schedule"
              className="block text-sm font-medium text-gray-700 mb-2">
              {t("courses.addModal.scheduleLabel")}
            </label>
            <input
              id="schedule"
              name="schedule"
              type="text"
              value={formData.schedule}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder={t("courses.addModal.schedulePlaceholder")}
              disabled={loading}
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-2">
              {t("courses.addModal.locationLabel")}
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              placeholder="e.g., Bldg 4, Room 101 or https://zoom.us/..."
              disabled={loading}
            />
          </div>

          {/* Credits */}
          <div>
            <label
              htmlFor="credits"
              className="block text-sm font-medium text-gray-700 mb-2">
              {t("courses.addModal.creditsLabel")}
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
              {t("courses.addModal.semesterLabel")}{" "}
              <span className="text-red-500">
                {t("courses.addModal.codeRequired")}
              </span>
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              disabled={loading}>
              <option value="" disabled>
                {t("courses.addModal.semesterPlaceholder")}
              </option>
              {semesterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t("courses.addModal.semesterDefault", {
                semester: currentSemester,
              })}
            </p>
          </div>

          {/* Course Outline / Syllabus */}
          <div>
            <label
              htmlFor="outlineText"
              className="block text-sm font-medium text-gray-700 mb-2">
              {t("courses.addModal.outlineLabel")}
            </label>
            <textarea
              id="outlineText"
              name="outlineText"
              value={formData.outlineText}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
              placeholder={t("courses.addModal.outlinePlaceholder")}
              rows="4"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("courses.addModal.outlineHint")}
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
              {t("courses.addModal.cancelButton")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}>
              {loading
                ? t("courses.addModal.addingButton")
                : t("courses.addModal.addButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
