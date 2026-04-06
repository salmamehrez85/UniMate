import { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Sparkles,
  Copy,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { getCourses } from "../services/courseService";
import { getUserData } from "../services/authService";
import {
  EMAIL_PURPOSES,
  buildEmailDraft,
} from "../components/Courses/GenerateEmailModal";

const HISTORY_KEY = "emailProfessorHistory";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EmailProfessor() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseId, setCourseId] = useState("");
  const [purpose, setPurpose] = useState(EMAIL_PURPOSES[0]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedId, setExpandedId] = useState(null);
  const [copiedHistoryId, setCopiedHistoryId] = useState(null);

  const studentName = getUserData()?.name || "";

  const availableCourses = useMemo(
    () => courses.filter((c) => !c.isOldCourse),
    [courses],
  );

  useEffect(() => {
    getCourses()
      .then((data) => {
        const all = data.courses || [];
        setCourses(all);
        const active = all.filter((c) => !c.isOldCourse);
        if (active.length > 0) setCourseId(active[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  const selectedCourse =
    availableCourses.find((c) => c._id === courseId) || null;

  const saveToHistory = (generatedDraft, course, emailPurpose) => {
    const entry = {
      id: Date.now().toString(),
      courseCode: course.code,
      courseName: course.name || course.title,
      professor: course.instructor || "Professor",
      purpose: emailPurpose,
      draft: generatedDraft,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...history];
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleGenerate = () => {
    if (!selectedCourse) return;
    const generated = buildEmailDraft({
      purpose,
      course: selectedCourse,
      additionalContext,
      studentName,
    });
    setDraft(generated);
    saveToHistory(generated, selectedCourse, purpose);
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
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDeleteHistory = (id) => {
    const updated = history.filter((e) => e.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleCopyHistory = async (entry) => {
    await navigator.clipboard.writeText(entry.draft);
    setCopiedHistoryId(entry.id);
    setTimeout(() => setCopiedHistoryId(null), 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-teal-50 rounded-lg">
          <Mail className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Email Professor</h1>
          <p className="text-gray-500 text-sm">
            Generate professional emails to your professors
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Composer */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          {draft ? (
            <>
              <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                AI-generated draft. Review and edit before sending.
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Draft
                </label>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full min-h-72 px-4 py-3 border border-gray-300 rounded-xl text-gray-800 leading-7 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                {loadingCourses ? (
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ) : availableCourses.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No active courses found.
                  </p>
                ) : (
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    {availableCourses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.code} – {course.name || course.title} (
                        {course.instructor || "Professor"})
                      </option>
                    ))}
                  </select>
                )}
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
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add any specific details you want included in the email..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedCourse}
                className="w-full px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Sparkles className="w-4 h-4" />
                Generate Email
              </button>
            </>
          )}

          <p className="text-xs text-gray-400">
            Always review AI-generated content for accuracy and appropriate
            tone.
          </p>
        </div>

        {/* History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Email History
            </h2>
            {history.length > 0 && (
              <span className="text-xs text-gray-400">
                {history.length} email{history.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No emails generated yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                          {entry.courseCode}
                        </span>
                        <span className="text-xs text-gray-500">
                          {entry.purpose}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1 truncate">
                        {entry.courseName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyHistory(entry)}
                        title="Copy"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(entry.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(
                            expandedId === entry.id ? null : entry.id,
                          )
                        }
                        title={expandedId === entry.id ? "Collapse" : "Expand"}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
                        {expandedId === entry.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {copiedHistoryId === entry.id && (
                    <div className="px-4 pb-2 text-xs text-teal-600 font-medium">
                      Copied!
                    </div>
                  )}

                  {expandedId === entry.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3">
                        {entry.draft}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
