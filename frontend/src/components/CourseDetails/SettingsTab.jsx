import { useState } from "react";
import { Save, X } from "lucide-react";
import { deleteCourse } from "../../services/courseService";
import { useTranslation } from "react-i18next";

export function SettingsTab({
  course,
  onCourseUpdate,
  onCourseDelete,
  onBack,
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    code: course.code || "",
    name: course.name || course.title || "",
    instructor: course.instructor || "",
    schedule: course.schedule || "",
    location: course.location || "",
    credits: course.credits || "",
    semester: course.semester || "",
    outlineText: course.outlineText || "",
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
          <h2 className="text-2xl font-bold text-primary-900">
            {t("courseDetails.settingsTab.editCourse")}
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
              {t("courseDetails.settingsTab.editButton")}
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
                  {t("courseDetails.settingsTab.codeLabel")} *
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
                  {t("courseDetails.settingsTab.nameLabel")} *
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
                  {t("courseDetails.settingsTab.instructorLabel")}
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
                  {t("courseDetails.settingsTab.scheduleLabel")}
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  placeholder="e.g., Mon & Wed 10:00 AM - 11:30 AM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("courseDetails.settingsTab.locationLabel")}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Bldg 4, Room 101 or https://zoom.us/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("courseDetails.settingsTab.creditsLabel")}
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
                  {t("courseDetails.settingsTab.semesterLabel")}
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

            {/* Course Outline / Syllabus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("courseDetails.settingsTab.outlineLabel")}
              </label>
              <textarea
                name="outlineText"
                value={formData.outlineText}
                onChange={handleChange}
                placeholder={t("courseDetails.settingsTab.outlinePlaceholder")}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {t("courseDetails.settingsTab.outlineHelper")}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
                <Save className="w-5 h-5" />
                {t("courseDetails.settingsTab.save")}
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
                    location: course.location || "",
                    credits: course.credits || "",
                    semester: course.semester || "",
                    outlineText: course.outlineText || "",
                  });
                  setError("");
                }}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
                <X className="w-5 h-5" />
                {t("courseDetails.settingsTab.cancel")}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t("courseDetails.settingsTab.codeLabel")}
                </p>
                <p className="text-lg font-semibold text-primary-900">
                  {course.code}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t("courseDetails.settingsTab.nameLabel")}
                </p>
                <p className="text-lg font-semibold text-primary-900">
                  {course.name || course.title}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t("courseDetails.settingsTab.instructorLabel")}
                </p>
                <p className="text-lg font-semibold text-primary-900">
                  {course.instructor ||
                    t("courseDetails.settingsTab.notSpecified")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t("courseDetails.settingsTab.scheduleLabel")}
                </p>
                <p className="text-lg font-semibold text-primary-900">
                  {course.schedule ||
                    t("courseDetails.settingsTab.notSpecified")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t("courseDetails.settingsTab.locationLabel")}
                </p>
                <p className="text-lg font-semibold text-primary-900">
                  {course.location ||
                    t("courseDetails.settingsTab.notSpecified")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t("courseDetails.settingsTab.creditsLabel")}
                </p>
                <p className="text-lg font-semibold text-primary-900">
                  {course.credits || t("courseDetails.settingsTab.na")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {t("courseDetails.settingsTab.semesterLabel")}
                </p>
                <p className="text-lg font-semibold text-primary-900">
                  {course.semester ||
                    t("courseDetails.settingsTab.notSpecified")}
                </p>
              </div>
            </div>

            {/* Course Outline Display */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-3">
                {t("courseDetails.settingsTab.outlineLabel")}
              </p>
              {course.outlineText ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {course.outlineText}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  {t("courseDetails.settingsTab.noOutline")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Course Section - Danger Zone */}
      <div className="bg-red-50 rounded-xl p-8 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-2">
          {t("courseDetails.settingsTab.dangerZone")}
        </h2>
        <p className="text-red-700 mb-6">
          {t("courseDetails.settingsTab.dangerWarning")}
        </p>

        <button
          onClick={() => setDeleteConfirm(true)}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
          {t("courseDetails.settingsTab.deleteCourse")}
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-primary-900 mb-2">
              {t("courseDetails.settingsTab.deleteConfirmTitle")}
            </h3>
            <p className="text-gray-600 mb-4">
              {t("courseDetails.settingsTab.deleteConfirmMessage")}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                {t("courseDetails.settingsTab.confirmDelete")}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
                {t("courseDetails.settingsTab.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
