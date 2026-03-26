import { useMemo, useState } from "react";
import { X, Mail, Sparkles, Copy, Send } from "lucide-react";

const EMAIL_PURPOSES = [
  "Request Deadline Extension",
  "Ask Question / Clarification",
  "Notify Absence",
  "Request Office Hours Meeting",
  "Follow-up on Previous Discussion",
  "Other",
];

const getCourseLabel = (course) => {
  const code = course?.code || "N/A";
  const name = course?.name || course?.title || "Untitled Course";
  const instructor = course?.instructor || "Professor";
  return `${code} - ${name} (${instructor})`;
};

const buildEmailDraft = ({
  purpose,
  course,
  additionalContext,
  studentName,
}) => {
  const courseCode = course?.code || "Course";
  const courseName = course?.name || course?.title || "this course";
  const professor = course?.instructor || "Professor";
  const context = additionalContext?.trim();
  const intro = `Dear ${professor},`;
  const sign = `\n\nBest regards,\n${studentName || "[Your Name]"}`;

  const purposeContent = {
    "Request Deadline Extension": {
      subject: `Request for Assignment Deadline Extension - ${courseCode}`,
      body: [
        "I hope you are doing well.",
        `I am writing regarding ${courseName} (${courseCode}) to kindly request a short extension for an upcoming deadline.`,
        "I am committed to submitting high-quality work and would be grateful for your consideration.",
        context ? `Additional context: ${context}` : null,
        "If possible, I would appreciate a brief extension and I will submit as soon as possible.",
        "Thank you for your time and understanding.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    "Ask Question / Clarification": {
      subject: `Question about ${courseCode} Materials`,
      body: [
        "I hope you are doing well.",
        `I have a question regarding ${courseName} (${courseCode}) and would appreciate your clarification.`,
        context
          ? `My question/context: ${context}`
          : "Could you please clarify the relevant concept or expectation when convenient?",
        "Thank you for your guidance.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    "Notify Absence": {
      subject: `Absence Notification - ${courseCode}`,
      body: [
        "I hope you are doing well.",
        `I am writing to inform you that I may miss an upcoming ${courseName} (${courseCode}) session.`,
        context
          ? `Reason/details: ${context}`
          : "I wanted to notify you in advance and ask if there is any material I should prioritize.",
        "I will review the missed content and stay up to date.",
        "Thank you for your understanding.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    "Request Office Hours Meeting": {
      subject: `Office Hours Request - ${courseCode}`,
      body: [
        "I hope you are doing well.",
        `I would like to request a brief office-hours meeting for ${courseName} (${courseCode}) to discuss course-related questions.`,
        context
          ? `Preferred time/details: ${context}`
          : "Please let me know a suitable time based on your availability.",
        "Thank you for your support.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    "Follow-up on Previous Discussion": {
      subject: `Follow-up on ${courseCode} Discussion`,
      body: [
        "I hope you are doing well.",
        `I am following up on our previous discussion about ${courseName} (${courseCode}).`,
        context
          ? `Follow-up details: ${context}`
          : "I wanted to check if there are any updates or next steps I should follow.",
        "Thank you again for your time and guidance.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    Other: {
      subject: `Regarding ${courseCode}`,
      body: [
        "I hope you are doing well.",
        context
          ? context
          : `I am writing regarding ${courseName} (${courseCode}) and would appreciate your help.`,
        "Thank you for your time.",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  };

  const selected = purposeContent[purpose] || purposeContent.Other;
  return `Subject: ${selected.subject}\n\n${intro}\n\n${selected.body}${sign}`;
};

export function GenerateEmailModal({
  isOpen,
  onClose,
  courses = [],
  selectedCourse = null,
  studentName = "",
}) {
  const availableCourses = useMemo(
    () => (courses || []).filter((course) => !course.isOldCourse),
    [courses],
  );

  const initialCourseId = selectedCourse?._id || availableCourses[0]?._id || "";
  const [courseId, setCourseId] = useState(initialCourseId);
  const [purpose, setPurpose] = useState(EMAIL_PURPOSES[0]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selected =
    availableCourses.find((course) => course._id === courseId) ||
    selectedCourse ||
    null;

  const handleGenerate = () => {
    if (!selected) return;
    const generated = buildEmailDraft({
      purpose,
      course: selected,
      additionalContext,
      studentName,
    });
    setDraft(generated);
  };

  const handleCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleOpenEmailApp = () => {
    if (!draft) return;
    const [subjectLine, ...rest] = draft.split("\n");
    const subject = subjectLine.replace(/^Subject:\s*/i, "").trim();
    const body = rest.join("\n").trim();
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-gray-100">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Generate Email to Professor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            type="button">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {draft ? (
            <>
              <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-generated draft. Review and edit before sending.
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Draft
                </label>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="w-full min-h-72 px-4 py-3 border border-gray-300 rounded-xl text-gray-800 leading-7 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDraft("")}
                  className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition">
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition inline-flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy Email"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenEmailApp}
                className="w-full px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition inline-flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Open in Email App
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Select Course & Professor
                </label>
                <select
                  value={courseId}
                  onChange={(event) => setCourseId(event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  {availableCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {getCourseLabel(course)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Purpose
                </p>
                <div className="space-y-2">
                  {EMAIL_PURPOSES.map((item) => {
                    const active = purpose === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPurpose(item)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                          active
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                        }`}>
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(event) => setAdditionalContext(event.target.value)}
                  placeholder="Add any specific details you want included in the email..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selected}
                className="w-full px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Sparkles className="w-4 h-4" />
                Generate Email
              </button>
            </>
          )}

          <p className="text-sm text-gray-500">
            Always review AI-generated content for accuracy and appropriate tone
          </p>
        </div>
      </div>
    </div>
  );
}
