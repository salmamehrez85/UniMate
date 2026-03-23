import { useEffect, useState } from "react";
import { SummarizerHeader } from "../components/Summarizer/SummarizerHeader";
import { SummarizerForm } from "../components/Summarizer/SummarizerForm";
import { SummaryResult } from "../components/Summarizer/SummaryResult";
import { getCourses, summarizeContent } from "../services/courseService";

const INITIAL_FORM = {
  sourceType: "text",
  mode: "quick",
  courseId: "",
  text: "",
};

export function Summarizer() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [summaryResult, setSummaryResult] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await getCourses();
        setCourses(response.courses || []);
      } catch (err) {
        console.error("Error loading courses for summarizer:", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const handleFieldChange = (field, value) => {
    if (field === "sourceType") {
      setSummaryResult(null);
      setError("");
      setForm((prev) => ({
        ...prev,
        sourceType: value,
        courseId: value === "courseOutline" ? prev.courseId : "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.sourceType === "courseOutline" && !form.courseId) {
      setError("Please select a course.");
      return;
    }

    if (form.sourceType === "text" && form.text.trim().length < 20) {
      setError("Please provide at least 20 characters to summarize.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await summarizeContent({
        sourceType: form.sourceType,
        mode: form.mode,
        courseId:
          form.sourceType === "courseOutline" ? form.courseId : undefined,
        text: form.sourceType === "text" ? form.text : "",
      });

      setSummaryResult(response.data?.result || null);
    } catch (err) {
      console.error("Summarizer request failed:", err);
      setError(err.message || "Failed to generate summary");
      setSummaryResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateClick = () => {
    const formElement = document.getElementById("summarizer-form");
    if (formElement) {
      formElement.requestSubmit();
    }
  };

  return (
    <div className="mt-20 space-y-6">
      <SummarizerHeader />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-primary-700 hover:bg-primary-800 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? "Generating Summary..." : "Generate Summary"}
        </button>
      </div>

      <SummarizerForm
        formId="summarizer-form"
        form={form}
        courses={courses}
        loadingCourses={loadingCourses}
        onChange={handleFieldChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <SummaryResult result={summaryResult} />
    </div>
  );
}
