import { useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const ASSESSMENT_TYPES = [
  { value: "quiz", label: "Quiz" },
  { value: "midterm", label: "Midterm" },
  { value: "final", label: "Final" },
  { value: "assignment", label: "Assignment" },
];

function AddAssessmentModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "quiz",
    score: "",
    maxScore: "100",
    date: "",
    weight: "",
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!formData.score || !formData.maxScore) {
      setError("Score and Max Score are required");
      return;
    }
    if (!formData.date) {
      setError("Date is required");
      return;
    }

    onAdd({
      id: Date.now(),
      ...formData,
      score: parseFloat(formData.score),
      maxScore: parseFloat(formData.maxScore),
      weight: formData.weight ? parseFloat(formData.weight) : null,
    });

    setFormData({
      title: "",
      type: "quiz",
      score: "",
      maxScore: "100",
      date: "",
      weight: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-primary-900">Add Assessment</h2>
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
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Quiz 2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
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
                Score *
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
                Max Score *
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
              Date *
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
              Weight (%) - Optional
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
              Add Assessment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AssessmentsTab({ course, onCourseUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const assessments = course.assessments || [];

  const handleAddAssessment = (newAssessment) => {
    const updated = {
      ...course,
      assessments: [newAssessment, ...assessments],
    };

    // Mark course as old if adding a final grade assessment
    if (newAssessment.type === "final") {
      updated.isOldCourse = true;
    }

    onCourseUpdate(updated);
    setIsModalOpen(false);
  };

  const handleDeleteAssessment = (id) => {
    const updated = {
      ...course,
      assessments: assessments.filter((a) => a.id !== id),
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
          Add Assessment
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-600 mb-4">No assessments added yet</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
            Add Your First Assessment
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Actions
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
                        disabled
                        title="Edit coming soon"
                        className="p-2 text-gray-400 cursor-not-allowed">
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
              Delete Assessment?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this assessment? This action
              cannot be undone.
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
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AddAssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddAssessment}
      />
    </div>
  );
}
