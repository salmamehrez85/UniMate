import { useEffect, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { SummarizerHeader } from "../components/Summarizer/SummarizerHeader";
import { SummarizerForm } from "../components/Summarizer/SummarizerForm";
import { SummaryResult } from "../components/Summarizer/SummaryResult";
import {
  getCourses,
  summarizeContent,
  summarizeUploadedContent,
} from "../services/courseService";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const INITIAL_FORM = {
  sourceType: "text",
  mode: "quick",
  language: "en",
  length: "medium",
  focus: "general",
  courseId: "",
  text: "",
  fileName: "",
  fileText: "",
  isScannedPdf: false,
  ocrImages: [],
  handwrittenImages: [],
};

const MODE_DEFAULTS = {
  quick: { length: "short", focus: "quick" },
  detailed: { length: "long", focus: "detailed" },
  exam: { length: "medium", focus: "exam" },
  custom: { length: "medium", focus: "general" },
};

const SUPPORTED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".rtf",
  ".log",
];

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_HANDWRITTEN_IMAGES = 10;

const MAX_UPLOAD_SIZE_MB = 10;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const PDF_TEXT_THRESHOLD = 200;
const OCR_MAX_PAGES = 6;

const extractPdfText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const pdf = await getDocument({ data: typedArray }).promise;

  const pagesText = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => item.str || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pagesText.push(pageText);
    }
  }

  return pagesText.join("\n\n").trim();
};

const renderPdfPagesAsBase64Images = async (file, maxPages = OCR_MAX_PAGES) => {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const pdf = await getDocument({ data: typedArray }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const images = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.4 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;

    const base64Image = canvas.toDataURL("image/jpeg", 0.85);
    images.push(base64Image);
  }

  return images;
};

export function Summarizer({ onNavigate }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingOCR, setIsPreparingOCR] = useState(false);
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
        setError(
          err?.message?.includes("Not authorized")
            ? "Session expired. Please log in again."
            : err?.message || "Failed to load courses.",
        );
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
        isScannedPdf: value === "file" ? prev.isScannedPdf : false,
        ocrImages: value === "file" ? prev.ocrImages : [],
        handwrittenImages:
          value === "handwritten" ? prev.handwrittenImages : [],
      }));
      return;
    }

    if (field === "mode") {
      const defaults = MODE_DEFAULTS[value] || MODE_DEFAULTS.quick;
      setForm((prev) => ({
        ...prev,
        mode: value,
        ...(value === "custom"
          ? {}
          : {
              length: defaults.length,
              focus: defaults.focus,
            }),
      }));
      setIsAdvancedOpen(value === "custom");
      return;
    }

    if (field === "length" || field === "focus") {
      setForm((prev) => ({
        ...prev,
        [field]: value,
        mode: prev.mode === "custom" ? prev.mode : "custom",
      }));
      setIsAdvancedOpen(true);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleAdvanced = () => {
    setIsAdvancedOpen((prev) => !prev);
  };

  const handleHandwrittenSelect = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setForm((prev) => ({ ...prev, handwrittenImages: [] }));
      return;
    }

    if (files.length > MAX_HANDWRITTEN_IMAGES) {
      setError(
        `You can upload at most ${MAX_HANDWRITTEN_IMAGES} images at once.`,
      );
      event.target.value = "";
      return;
    }

    const invalidType = files.find(
      (f) => !SUPPORTED_IMAGE_TYPES.includes(f.type),
    );
    if (invalidType) {
      setError(
        `Unsupported image format: ${invalidType.name}. Use JPG, PNG, or WebP.`,
      );
      event.target.value = "";
      return;
    }

    const oversized = files.find((f) => f.size > MAX_UPLOAD_SIZE_BYTES);
    if (oversized) {
      setError(
        `Image too large: ${oversized.name}. Max size is ${MAX_UPLOAD_SIZE_MB} MB per image.`,
      );
      event.target.value = "";
      return;
    }

    setForm((prev) => ({ ...prev, handwrittenImages: files }));
    setSummaryResult(null);
    setError("");
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((prev) => ({
        ...prev,
        fileName: "",
        fileText: "",
        isScannedPdf: false,
        ocrImages: [],
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
        isScannedPdf: false,
        ocrImages: [],
      }));
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError(
        `File is too large. Please upload a file up to ${MAX_UPLOAD_SIZE_MB} MB.`,
      );
      setForm((prev) => ({
        ...prev,
        fileName: "",
        fileText: "",
        isScannedPdf: false,
        ocrImages: [],
      }));
      return;
    }

    try {
      let textContent = "";
      let isScannedPdf = false;
      let ocrImages = [];

      if (fileNameLower.endsWith(".pdf")) {
        textContent = await extractPdfText(file);

        if (textContent.trim().length < PDF_TEXT_THRESHOLD) {
          isScannedPdf = true;
          setIsPreparingOCR(true);
          ocrImages = await renderPdfPagesAsBase64Images(file, OCR_MAX_PAGES);
        }
      } else {
        textContent = await file.text();
      }

      if (!isScannedPdf && textContent.trim().length < 20) {
        throw new Error("The uploaded file has too little readable text.");
      }

      if (isScannedPdf && ocrImages.length === 0) {
        throw new Error(
          "This PDF seems scanned, but no page images were generated for OCR.",
        );
      }

      setForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileText: textContent,
        isScannedPdf,
        ocrImages,
      }));
      setSummaryResult(null);
      setError("");
    } catch (readError) {
      console.error("Failed to read uploaded file:", readError);
      setError(
        readError?.message ||
          "Could not read this file. Please try a supported text file or a text-based PDF.",
      );
      setForm((prev) => ({
        ...prev,
        fileName: "",
        fileText: "",
        isScannedPdf: false,
        ocrImages: [],
      }));
    } finally {
      setIsPreparingOCR(false);
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
      if (!form.isScannedPdf) {
        setError("Please upload a text-based file with enough content.");
        return;
      }
    }

    if (
      form.sourceType === "file" &&
      form.isScannedPdf &&
      (!Array.isArray(form.ocrImages) || form.ocrImages.length === 0)
    ) {
      setError("OCR images were not prepared. Please re-upload the PDF.");
      return;
    }

    if (
      form.sourceType === "handwritten" &&
      (!Array.isArray(form.handwrittenImages) ||
        form.handwrittenImages.length === 0)
    ) {
      setError("Please upload at least one image of your handwritten notes.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      let response;

      if (form.sourceType === "handwritten") {
        // Convert each image File to base64 and send via the existing OCR path
        const imageDataArray = await Promise.all(
          form.handwrittenImages.map(
            (file) =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = reader.result; // data:image/...;base64,...
                  resolve({ mimeType: file.type, data: base64.split(",")[1] });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
              }),
          ),
        );

        const uploadData = new FormData();
        uploadData.append("sourceType", "handwritten");
        uploadData.append("mode", form.mode);
        uploadData.append("language", form.language);
        uploadData.append("length", form.length);
        uploadData.append("focus", form.focus);
        uploadData.append("isHandwritten", "true");
        uploadData.append("ocrImages", JSON.stringify(imageDataArray));

        response = await summarizeUploadedContent(uploadData);
      } else if (form.sourceType === "file") {
        const uploadData = new FormData();
        uploadData.append("sourceType", "file");
        uploadData.append("mode", form.mode);
        uploadData.append("language", form.language);
        uploadData.append("length", form.length);
        uploadData.append("focus", form.focus);

        if (form.fileText) {
          uploadData.append("text", form.fileText);
        }

        if (form.isScannedPdf && Array.isArray(form.ocrImages)) {
          uploadData.append("ocrImages", JSON.stringify(form.ocrImages));
        }

        response = await summarizeUploadedContent(uploadData);
      } else {
        response = await summarizeContent({
          sourceType: form.sourceType,
          mode: form.mode,
          options: {
            language: form.language,
            length: form.length,
            focus: form.focus,
          },
          courseId:
            form.sourceType === "courseOutline" ? form.courseId : undefined,
          text: form.sourceType === "text" ? form.text : "",
        });
      }

      const uploadResult = response?.data?.result;
      const normalizedResult = uploadResult?.overview
        ? {
            summary: uploadResult.overview,
            plainLanguageSummary: uploadResult.overview,
            learningOutcomes: uploadResult.keyTopics || [],
            conceptConnections: [],
            examFocus: [],
            importantTerms: uploadResult.importantDefinitions || [],
            studyPlan: uploadResult.studyPlan || [],
            possibleQuestions: uploadResult.possibleQuestions || [],
            actionItems: uploadResult.studyPlan || [],
          }
        : response?.data?.result || null;

      setSummaryResult(
        response.data
          ? {
              mode: response.data.mode,
              options: response.data.options || {
                language: form.language,
                length: form.length,
                focus: form.focus,
              },
              result: normalizedResult,
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm space-y-2">
          <p className="font-semibold">{error}</p>
          {error.includes("GEMINI") || error.includes("API Key") ? (
            <div className="text-xs text-red-600 bg-red-100 p-2 rounded mt-2">
              <p className="font-semibold mb-1">Steps to fix:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Visit:{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-red-700">
                    https://aistudio.google.com/apikey
                  </a>
                </li>
                <li>Create or copy a valid API key</li>
                <li>
                  Update <code className="bg-red-200 px-1">GEMINI_API_KEY</code>{" "}
                  in <code className="bg-red-200 px-1">backend/.env</code>
                </li>
                <li>Restart the backend server</li>
              </ol>
            </div>
          ) : null}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isSubmitting || isPreparingOCR}
          className="w-full inline-flex items-center justify-center px-5 py-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isPreparingOCR
            ? "OCR in progress..."
            : isSubmitting
              ? "Generating Summary..."
              : "Generate Summary"}
        </button>
      </div>

      <SummarizerForm
        formId="summarizer-form"
        form={form}
        courses={courses}
        loadingCourses={loadingCourses}
        isPreparingOCR={isPreparingOCR}
        isAdvancedOpen={isAdvancedOpen}
        onChange={handleFieldChange}
        onToggleAdvanced={handleToggleAdvanced}
        onFileSelect={handleFileSelect}
        onHandwrittenSelect={handleHandwrittenSelect}
        onSubmit={handleSubmit}
      />

      <SummaryResult
        summaryData={summaryResult}
        onNavigate={onNavigate}
        courses={courses}
      />
    </div>
  );
}
