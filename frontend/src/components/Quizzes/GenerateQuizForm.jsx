import { LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const getDefaultFormValues = (courseId) => ({
  courseId: courseId || "",
  questionType: "all",
  numberOfQuestions: 10,
  difficulty: "medium",
});

export function GenerateQuizForm({
  courses,
  selectedCourseId,
  onSelectCourse,
  onGenerateQuiz,
  isGenerating,
  error,
}) {
  const [formValues, setFormValues] = useState(
    getDefaultFormValues(selectedCourseId),
  );

  useEffect(() => {
    setFormValues((currentValues) => ({
      ...currentValues,
      courseId: selectedCourseId || currentValues.courseId,
    }));
  }, [selectedCourseId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: name === "numberOfQuestions" ? Number(value) : value,
    }));

    if (name === "courseId") {
      onSelectCourse(value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onGenerateQuiz(formValues);
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-primary-900">
          Generate Custom Quiz
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          <select
            name="courseId"
            value={formValues.courseId}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            disabled={isGenerating}>
            {courses.length === 0 && <option value="">No courses found</option>}
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Type
          </label>
          <select
            name="questionType"
            value={formValues.questionType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            disabled={isGenerating}>
            <option value="all">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="choose">Choose</option>
            <option value="complete">Complete</option>
            <option value="truefalse">True/False</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <input
              name="numberOfQuestions"
              type="number"
              min="5"
              max="30"
              value={formValues.numberOfQuestions}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              disabled={isGenerating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={formValues.difficulty}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              disabled={isGenerating}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isGenerating || !formValues.courseId}>
          {isGenerating ? (
            <>
              <LoaderCircle className="w-5 h-5 animate-spin" />
              Generating quiz...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Quiz
            </>
          )}
        </button>
      </form>
    </section>
  );
}
