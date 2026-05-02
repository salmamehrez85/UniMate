import { useTranslation } from "react-i18next";

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
  onHandwrittenSelect,
  onSubmit,
  formId = "summarizer-form",
}) {
  const { t } = useTranslation();
  const activeCourses = (courses || []).filter((course) => !course.isOldCourse);

  const SUMMARY_MODES = [
    { value: "quick", label: t("summarizer.modes.quick") },
    { value: "detailed", label: t("summarizer.modes.detailed") },
    { value: "exam", label: t("summarizer.modes.exam") },
    { value: "custom", label: t("summarizer.modes.custom") },
  ];

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">{t("summarizer.form.sourceLabel")}</span>
          <select
            value={form.sourceType}
            onChange={(event) => onChange("sourceType", event.target.value)}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400">
            <option value="text">{t("summarizer.form.pasteText")}</option>
            <option value="courseOutline">{t("summarizer.form.courseOutline")}</option>
            <option value="file">{t("summarizer.form.uploadFile")}</option>
            <option value="handwritten">{t("summarizer.form.handwritten")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            {t("summarizer.form.modeLabel")}
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
          {t("summarizer.form.advancedHint")}
        </span>
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="text-xs font-medium text-teal-700 hover:text-teal-800 underline underline-offset-2">
          {isAdvancedOpen ? t("summarizer.form.hideAdvanced") : t("summarizer.form.showAdvanced")}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">{t("summarizer.form.languageLabel")}</span>
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
            <span className="text-sm font-medium text-gray-700">{t("summarizer.form.lengthLabel")}</span>
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
            <span className="text-sm font-medium text-gray-700">{t("summarizer.form.focusLabel")}</span>
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
            {t("summarizer.form.selectCourseLabel")}
          </span>
          <select
            value={form.courseId}
            onChange={(event) => onChange("courseId", event.target.value)}
            disabled={loadingCourses}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 disabled:opacity-60">
            <option value="">{t("summarizer.form.chooseCourse")}</option>
            {activeCourses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            {loadingCourses
              ? t("summarizer.form.loadingCourses")
              : activeCourses.length > 0
                ? t("summarizer.form.outlineHint")
                : t("summarizer.form.noCoursesHint")}
          </span>
        </label>
      ) : form.sourceType === "file" ? (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">{t("summarizer.form.uploadFileLabel")}</span>
          <input
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.rtf,.log,application/pdf,text/plain,text/markdown,text/csv,application/json"
            onChange={onFileSelect}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary-100 file:text-primary-800 file:font-medium hover:file:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
          />
          <span className="text-xs text-gray-500">
            {t("summarizer.form.uploadFileHint")}
          </span>
          {isPreparingOCR && (
            <span className="text-xs text-amber-700">
              {t("summarizer.form.ocrInProgress")}
            </span>
          )}
          {form.isScannedPdf && !isPreparingOCR && (
            <span className="text-xs text-amber-700">
              {t("summarizer.form.ocrReady")}
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
      ) : form.sourceType === "handwritten" ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">
              Upload Handwritten Notes
            </span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={onHandwrittenSelect}
              className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary-100 file:text-primary-800 file:font-medium hover:file:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
            <span className="text-xs text-gray-500">
              Supported: .jpg, .jpeg, .png, .webp — up to 10 images, max 10 MB
              each.
            </span>
          </label>
          {form.handwrittenImages && form.handwrittenImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.handwrittenImages.map((file, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Page ${idx + 1}`}
                    className="w-20 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded">
                    {idx + 1}
                  </span>
                </div>
              ))}
                <span className="self-center text-xs text-primary-700 font-medium">
                  {form.handwrittenImages.length} {t("summarizer.form.imagesSelected")}
                </span>
            </div>
          )}
        </div>
      ) : (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            {t("summarizer.form.textLabel")}
          </span>
          <textarea
            value={form.text}
            onChange={(event) => onChange("text", event.target.value)}
            placeholder={t("summarizer.form.textPlaceholder")}
            rows={9}
            className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 resize-y"
          />
          <span className="text-xs text-gray-500">
            {t("summarizer.form.textHint")}
          </span>
        </label>
      )}
    </form>
  );
}
