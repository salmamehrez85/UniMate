import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const defaultFormData = {
  title: "",
  type: "quiz",
  score: "",
  maxScore: "100",
  date: "",
  weight: "",
};

const normalizeDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && value.length >= 10) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const hasFinalAssessment = (list) =>
  list.some((assessment) => assessment.type === "final");

function AssessmentModal({ isOpen, onClose, onSubmit, initialData }) {
  const { t } = useTranslation();
  const ASSESSMENT_TYPES = [
    { value: "quiz", label: t("courseDetails.assessments.quiz") },
    { value: "midterm", label: t("courseDetails.assessments.midterm") },
    { value: "final", label: t("courseDetails.assessments.final") },
    { value: "assignment", label: t("courseDetails.assessments.assignment") },
  ];
  const [formData, setFormData] = useState(defaultFormData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        title: initialData.title || "",
        type: initialData.type || "quiz",
        score:
          initialData.score !== null && initialData.score !== undefined
            ? String(initialData.score)
            : "",
        maxScore:
          initialData.maxScore !== null && initialData.maxScore !== undefined
            ? String(initialData.maxScore)
            : "100",
        date: normalizeDateInput(initialData.date),
        weight:
          initialData.weight !== null && initialData.weight !== undefined
            ? String(initialData.weight)
            : "",
      });
    } else {
      setFormData(defaultFormData);
    }

    setError("");
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError(t("courseDetails.assessments.titleRequired"));
      return;
    }
    if (!formData.score || !formData.maxScore) {
      setError(t("courseDetails.assessments.scoreRequired"));
      return;
    }
    if (!formData.date) {
      setError(t("courseDetails.assessments.dateRequired"));
      return;
    }

    onSubmit({
      id: initialData?.id ?? Date.now(),
      ...formData,
      score: parseFloat(formData.score),
      maxScore: parseFloat(formData.maxScore),
      weight: formData.weight ? parseFloat(formData.weight) : null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-primary-900">
            {initialData
              ? t("courseDetails.assessments.editTitle")
              : t("courseDetails.assessments.addTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("courseDetails.assessments.titleLabel")} *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t("courseDetails.assessments.titlePlaceholder")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("courseDetails.assessments.typeLabel")} *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
              {ASSESSMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("courseDetails.assessments.scoreLabel")} *
              </label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                placeholder="0"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("courseDetails.assessments.maxScoreLabel")} *
              </label>
              <input
                type="number"
                name="maxScore"
                value={formData.maxScore}
                onChange={handleChange}
                placeholder="100"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("courseDetails.assessments.dateLabel")} *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("courseDetails.assessments.weightLabel")}
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g., 10"
              step="0.1"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
              {initialData
                ? t("courseDetails.assessments.save")
                : t("courseDetails.assessments.add")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
              {t("courseDetails.assessments.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssessmentsTab({ course, onCourseUpdate }) {
  const { t } = useTranslation();
  const ASSESSMENT_TYPES = [
    { value: "quiz", label: t("courseDetails.assessments.quiz") },
    { value: "midterm", label: t("courseDetails.assessments.midterm") },
    { value: "final", label: t("courseDetails.assessments.final") },
    { value: "assignment", label: t("courseDetails.assessments.assignment") },
  ];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const assessments = course.assessments || [];

  const handleAddAssessment = (newAssessment) => {
    const updatedAssessments = [newAssessment, ...assessments];
    const updated = {
      ...course,
      assessments: updatedAssessments,
    };

    updated.isOldCourse = hasFinalAssessment(updatedAssessments);

    onCourseUpdate(updated);
    setIsModalOpen(false);
  };

  const handleEditAssessment = (updatedAssessment) => {
    const updatedAssessments = assessments.map((assessment) =>
      assessment.id === updatedAssessment.id ? updatedAssessment : assessment,
    );

    const updated = {
      ...course,
      assessments: updatedAssessments,
      isOldCourse: hasFinalAssessment(updatedAssessments),
    };

    onCourseUpdate(updated);
    setEditingAssessment(null);
  };

  const handleDeleteAssessment = (id) => {
    const updatedAssessments = assessments.filter(
      (assessment) => assessment.id !== id,
    );
    const updated = {
      ...course,
      assessments: updatedAssessments,
      isOldCourse: hasFinalAssessment(updatedAssessments),
    };
    onCourseUpdate(updated);
    setDeleteConfirm(null);
  };

  const getTypeLabel = (type) => {
    const found = ASSESSMENT_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="space-y-6">
      {course.isOldCourse}

      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
          <Plus className="w-5 h-5" />
          {t("courseDetails.assessments.add")}
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-600 mb-4">
            {t("courseDetails.assessments.noAssessments")}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
            {t("courseDetails.assessments.addFirst")}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("courseDetails.assessments.titleHeader")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("courseDetails.assessments.typeHeader")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("courseDetails.assessments.scoreHeader")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("courseDetails.assessments.dateHeader")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("courseDetails.assessments.weightHeader")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("courseDetails.assessments.actionsHeader")}
                </th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => (
                <tr
                  key={assessment.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-primary-900">
                    {assessment.title}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {getTypeLabel(assessment.type)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {assessment.score} / {assessment.maxScore}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(assessment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {assessment.weight ? `${assessment.weight}%` : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAssessment(assessment)}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(assessment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-primary-900 mb-4">
              {t("courseDetails.assessments.deleteTitle")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("courseDetails.assessments.deleteConfirm")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteAssessment(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
                {t("courseDetails.assessments.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <AssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddAssessment}
      />

      <AssessmentModal
        isOpen={Boolean(editingAssessment)}
        onClose={() => setEditingAssessment(null)}
        onSubmit={handleEditAssessment}
        initialData={editingAssessment}
      />
    </div>
  );
}
