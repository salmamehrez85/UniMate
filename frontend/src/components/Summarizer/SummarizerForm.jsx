const SUMMARY_MODES = [
  { value: "quick", label: "Quick" },
  { value: "detailed", label: "Detailed" },
  { value: "exam", label: "Exam Focus" },
  { value: "custom", label: "Custom" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
];

const LENGTH_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

const FOCUS_OPTIONS = [
  { value: "general", label: "General" },
  { value: "exam", label: "Exam" },
  { value: "action", label: "Action" },
  { value: "detailed", label: "Detailed" },
  { value: "quick", label: "Quick" },
];

export function SummarizerForm({
  form,
  courses,
  loadingCourses,
  isPreparingOCR = false,
  isAdvancedOpen = false,
  onChange,
  onToggleAdvanced,
  onFileSelect,
  onSubmit,
  formId = "summarizer-form",
}) {
  const activeCourses = (courses || []).filter((course) => !course.isOldCourse);

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Source</span>
          <select
            value={form.sourceType}
            onChange={(event) => onChange("sourceType", event.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400">
            <option value="text">Paste Text</option>
            <option value="courseOutline">Course Outline</option>
            <option value="file">Upload File</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            Summary Mode
          </span>
          <select
            value={form.mode}
            onChange={(event) => onChange("mode", event.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400">
            {SUMMARY_MODES.map((modeOption) => (
              <option key={modeOption.value} value={modeOption.value}>
                {modeOption.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-xs text-gray-500">
          Choose source and mode, then generate. Use advanced options only when
          you need custom tuning.
        </span>
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="text-xs font-medium text-teal-700 hover:text-teal-800 underline underline-offset-2">
          {isAdvancedOpen ? "Hide Advanced Options" : "Show Advanced Options"}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Language</span>
          <select
            value={form.language}
            onChange={(event) => onChange("language", event.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400">
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isAdvancedOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="grid md:grid-cols-2 gap-4 pt-1">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Length</span>
            <select
              value={form.length}
              onChange={(event) => onChange("length", event.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400">
              {LENGTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Focus</span>
            <select
              value={form.focus}
              onChange={(event) => onChange("focus", event.target.value)}
              className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400">
              {FOCUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {form.sourceType === "courseOutline" ? (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            Select Course
          </span>
          <select
            value={form.courseId}
            onChange={(event) => onChange("courseId", event.target.value)}
            disabled={loadingCourses}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 disabled:opacity-60">
            <option value="">Choose a course</option>
            {activeCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            {loadingCourses
              ? "Loading courses..."
              : activeCourses.length > 0
                ? "Only active courses are shown. If a course has no outline text, you will be asked to add one."
                : "No active courses found yet. Add an active course first, then try Course Outline."}
          </span>
        </label>
      ) : form.sourceType === "file" ? (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Upload File</span>
          <input
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.rtf,.log,application/pdf,text/plain,text/markdown,text/csv,application/json"
            onChange={onFileSelect}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary-100 file:text-primary-800 file:font-medium hover:file:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
          />
          <span className="text-xs text-gray-500">
            Supported: .pdf, .txt, .md, .csv, .json, .rtf, .log (max 10 MB)
          </span>
          {isPreparingOCR && (
            <span className="text-xs text-amber-700">
              OCR in progress... preparing page images from scanned PDF.
            </span>
          )}
          {form.isScannedPdf && !isPreparingOCR && (
            <span className="text-xs text-amber-700">
              Scanned PDF detected. OCR images are ready.
            </span>
          )}
          {form.fileName &&
            (() => {
              const chars = form.fileText?.length || 0;
              const readMins = Math.max(1, Math.ceil(chars / 1000));
              return (
                <span className="text-xs text-primary-700">
                  Selected: {form.fileName} ({chars.toLocaleString()} chars · ~
                  {readMins} min read)
                </span>
              );
            })()}
        </label>
      ) : (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            Text to Summarize
          </span>
          <textarea
            value={form.text}
            onChange={(event) => onChange("text", event.target.value)}
            placeholder="Paste your lecture notes, assignment details, or any study content..."
            rows={9}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 resize-y"
          />
          <span className="text-xs text-gray-500">
            Minimum recommended length: 20 characters.
          </span>
        </label>
      )}
    </form>
  );
}
