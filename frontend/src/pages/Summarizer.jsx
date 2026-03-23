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
  fileName: "",
  fileText: "",
};

const SUPPORTED_UPLOAD_EXTENSIONS = [
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".rtf",
  ".log",
];

const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;

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
        text: value === "text" ? prev.text : "",
        fileName: value === "file" ? prev.fileName : "",
        fileText: value === "file" ? prev.fileText : "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((prev) => ({
        ...prev,
        fileName: "",
        fileText: "",
      }));
      return;
    }

    const fileNameLower = file.name.toLowerCase();
    const isSupported = SUPPORTED_UPLOAD_EXTENSIONS.some((extension) =>
      fileNameLower.endsWith(extension),
    );

    if (!isSupported) {
      setError(
        `Unsupported file type. Please upload one of: ${SUPPORTED_UPLOAD_EXTENSIONS.join(", ")}`,
      );
      setForm((prev) => ({
        ...prev,
        fileName: "",
        fileText: "",
      }));
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError("File is too large. Please upload a file up to 2 MB.");
      setForm((prev) => ({
        ...prev,
        fileName: "",
        fileText: "",
      }));
      return;
    }

    try {
      const textContent = await file.text();

      setForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileText: textContent,
      }));
      setSummaryResult(null);
      setError("");
    } catch (readError) {
      console.error("Failed to read uploaded file:", readError);
      setError("Could not read this file. Please try a plain text-based file.");
      setForm((prev) => ({
        ...prev,
        fileName: "",
        fileText: "",
      }));
    }
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

    if (form.sourceType === "file" && form.fileText.trim().length < 20) {
      setError("Please upload a text-based file with enough content.");
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
        text:
          form.sourceType === "text"
            ? form.text
            : form.sourceType === "file"
              ? form.fileText
              : "",
      });

      setSummaryResult(
        response.data
          ? {
              mode: response.data.mode,
              result: response.data.result,
            }
          : null,
      );
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
          className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? "Generating Summary..." : "Generate Summary"}
        </button>
      </div>

      <SummarizerForm
        formId="summarizer-form"
        form={form}
        courses={courses}
        loadingCourses={loadingCourses}
        onChange={handleFieldChange}
        onFileSelect={handleFileSelect}
        onSubmit={handleSubmit}
      />

      <SummaryResult summaryData={summaryResult} />
    </div>
  );
}
