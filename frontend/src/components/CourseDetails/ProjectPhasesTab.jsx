import { useState } from "react";
import {
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
} from "lucide-react";

function AddPhaseModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    requirements: [""],
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

  const handleRequirementChange = (index, value) => {
    const newReqs = [...formData.requirements];
    newReqs[index] = value;
    setFormData((prev) => ({
      ...prev,
      requirements: newReqs,
    }));
  };

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const removeRequirement = (index) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Phase title is required");
      return;
    }
    if (!formData.dueDate) {
      setError("Due date is required");
      return;
    }

    const filteredReqs = formData.requirements.filter((r) => r.trim());

    onAdd({
      id: Date.now(),
      title: formData.title,
      dueDate: formData.dueDate,
      requirements: filteredReqs.map((req) => ({
        id: Date.now() + Math.random(),
        text: req,
        completed: false,
      })),
    });

    setFormData({
      title: "",
      dueDate: "",
      requirements: [""],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-primary-900">
            Add Project Phase
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
              Phase Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Phase 1: Requirements"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Requirements
              </label>
              <button
                type="button"
                onClick={addRequirement}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold">
                + Add Requirement
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) =>
                      handleRequirementChange(index, e.target.value)
                    }
                    placeholder={`Requirement ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
              Add Phase
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

export function ProjectPhasesTab({ course, onCourseUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const phases = course.phases || [];

  const handleAddPhase = (newPhase) => {
    const updated = {
      ...course,
      phases: [newPhase, ...phases],
    };
    onCourseUpdate(updated);
    setIsModalOpen(false);
  };

  const handleDeletePhase = (id) => {
    const updated = {
      ...course,
      phases: phases.filter((p) => p.id !== id),
    };
    onCourseUpdate(updated);
    setDeleteConfirm(null);
  };

  const handleToggleRequirement = (phaseId, requirementId) => {
    const updated = {
      ...course,
      phases: phases.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              requirements: phase.requirements.map((req) =>
                req.id === requirementId
                  ? { ...req, completed: !req.completed }
                  : req,
              ),
            }
          : phase,
      ),
    };
    onCourseUpdate(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
          <Plus className="w-5 h-5" />
          Add Phase
        </button>
      </div>

      {phases.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-600 mb-4">No project phases added yet</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition">
            Add Your First Phase
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => {
            const isExpanded = expandedPhase === phase.id;
            const completedRequirements = phase.requirements.filter(
              (r) => r.completed,
            ).length;
            const totalRequirements = phase.requirements.length;

            return (
              <div
                key={phase.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition">
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-primary-900">
                      {phase.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600">
                        📅 {new Date(phase.dueDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded">
                        {completedRequirements} of {totalRequirements} completed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(phase.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">
                      Requirements
                    </h4>
                    {phase.requirements.length === 0 ? (
                      <p className="text-gray-600 text-sm">
                        No requirements added
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {phase.requirements.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                            <button
                              onClick={() =>
                                handleToggleRequirement(phase.id, req.id)
                              }
                              className="text-gray-400 hover:text-teal-500 transition flex-shrink-0">
                              {req.completed ? (
                                <CheckCircle className="w-5 h-5 text-teal-500" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            <span
                              className={`text-sm ${
                                req.completed
                                  ? "text-gray-400 line-through"
                                  : "text-gray-700"
                              }`}>
                              {req.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-primary-900 mb-4">
              Delete Phase?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this phase? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeletePhase(deleteConfirm)}
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

      <AddPhaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddPhase}
      />
    </div>
  );
}
