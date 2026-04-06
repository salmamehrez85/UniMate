import { useState, useEffect, useMemo } from "react";
import {
  Mail,
  Sparkles,
  Copy,
  Send,
  Trash2,
  Clock,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Hourglass,
  FileText,
  ChevronRight,
} from "lucide-react";
import { getCourses } from "../services/courseService";
import { getUserData } from "../services/authService";
import {
  EMAIL_PURPOSES,
  buildEmailDraft,
} from "../components/Courses/GenerateEmailModal";

const HISTORY_KEY = "emailProfessorHistory";

// status: "pending" | "awaiting_reply" | "replied"
// pending       = draft generated, never opened in email app
// awaiting_reply = user clicked "Open in Email App"
// replied        = user manually marked as replied
const STATUS_CONFIG = {
  pending: {
    label: "Pending Action",
    color: "bg-gray-100 text-gray-600",
    Icon: FileText,
  },
  awaiting_reply: {
    label: "Awaiting Reply",
    color: "bg-amber-50 text-amber-600",
    Icon: Hourglass,
  },
  replied: {
    label: "Replied",
    color: "bg-green-50 text-green-600",
    Icon: CheckCircle2,
  },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Composer sub-component ───────────────────────────────────────────────────
function Composer({
  courses,
  loadingCourses,
  studentName,
  onSaved,
  onMarkOpened,
  onCancel,
}) {
  const availableCourses = useMemo(
    () => courses.filter((c) => !c.isOldCourse),
    [courses],
  );
  const [courseId, setCourseId] = useState(
    () => availableCourses[0]?._id || "",
  );
  const [purpose, setPurpose] = useState(EMAIL_PURPOSES[0]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState(null);

  const selectedCourse =
    availableCourses.find((c) => c._id === courseId) || null;

  const handleGenerate = () => {
    if (!selectedCourse) return;
    const generated = buildEmailDraft({
      purpose,
      course: selectedCourse,
      additionalContext,
      studentName,
    });
    setDraft(generated);
    const newId = onSaved(generated, selectedCourse, purpose);
    setSavedEntryId(newId);
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
    if (savedEntryId) onMarkOpened(savedEntryId);
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="mt-20 space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          Compose New Email
        </h2>

        {draft ? (
          <>
            <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
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
                Regenerate
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
          Always review AI-generated content for accuracy and appropriate tone.
        </p>
      </div>
    </div>
  );
}

// ─── Detail sub-component ─────────────────────────────────────────────────────
function EmailDetail({ entry, onBack, onStatusChange, onDelete }) {
  const [copied, setCopied] = useState(false);
  const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry.draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleOpenEmailApp = () => {
    const [subjectLine, ...rest] = entry.draft.split("\n");
    const subject = subjectLine.replace(/^Subject:\s*/i, "").trim();
    const body = rest.join("\n").trim();
    onStatusChange(entry.id, "awaiting_reply");
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="mt-20 space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">
        {/* Top meta */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                {entry.courseCode}
              </span>
              <span className="text-xs text-gray-500">{entry.purpose}</span>
            </div>
            <h2 className="text-base font-bold text-gray-800">
              {entry.courseName}
            </h2>
            <p className="text-sm text-gray-500">
              To: {entry.professor} &bull; {formatDate(entry.createdAt)}
            </p>
          </div>

          {/* Status badge — read-only; actions below drive state changes */}
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${cfg.color}`}>
              <cfg.Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Draft */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Email Content
          </label>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
            {entry.draft}
          </pre>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition inline-flex items-center justify-center gap-2">
            <Copy className="w-4 h-4" />
            {copied ? "Copied!" : "Copy Email"}
          </button>
          {entry.status === "pending" && (
            <button
              type="button"
              onClick={handleOpenEmailApp}
              className="px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition inline-flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Open in Email App
            </button>
          )}
          {entry.status === "awaiting_reply" && (
            <button
              type="button"
              onClick={() => onStatusChange(entry.id, "replied")}
              className="px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition inline-flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Mark as Replied
            </button>
          )}
          {entry.status === "replied" && (
            <button
              type="button"
              onClick={() => onStatusChange(entry.id, "awaiting_reply")}
              className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold transition inline-flex items-center justify-center gap-2">
              <Hourglass className="w-4 h-4" />
              Re-open
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="text-xs text-red-400 hover:text-red-600 transition inline-flex items-center gap-1">
          <Trash2 className="w-3.5 h-3.5" />
          Delete this record
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function EmailProfessor() {
  // "dashboard" | "compose" | "detail"
  const [view, setView] = useState("dashboard");
  const [detailEntry, setDetailEntry] = useState(null);

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    // backfill: old "sent" entries → "awaiting_reply"; missing status → "pending"
    return parsed.map((e) => ({
      status: e.status === "sent" ? "awaiting_reply" : e.status || "pending",
      ...e,
    }));
  });

  const studentName = getUserData()?.name || "";

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(data.courses || []))
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  const persistHistory = (updated) => {
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleSaved = (generatedDraft, course, emailPurpose) => {
    const entry = {
      id: Date.now().toString(),
      courseCode: course.code,
      courseName: course.name || course.title,
      professor: course.instructor || "Professor",
      purpose: emailPurpose,
      draft: generatedDraft,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    persistHistory([entry, ...history]);
    return entry.id;
  };

  const handleStatusChange = (id, newStatus) => {
    persistHistory(
      history.map((e) => (e.id === id ? { ...e, status: newStatus } : e)),
    );
    // also update detailEntry in-place so the open detail view reflects it
    if (detailEntry?.id === id) {
      setDetailEntry((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleDelete = (id) => {
    persistHistory(history.filter((e) => e.id !== id));
    setView("dashboard");
    setDetailEntry(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalDrafts = history.length;
  const totalPending = history.filter((e) => e.status === "pending").length;
  const totalAwaiting = history.filter(
    (e) => e.status === "awaiting_reply",
  ).length;
  const totalOpened = history.filter(
    (e) => e.status === "awaiting_reply" || e.status === "replied",
  ).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (view === "compose") {
    return (
      <Composer
        courses={courses}
        loadingCourses={loadingCourses}
        studentName={studentName}
        onSaved={(draft, course, purpose) => {
          const id = handleSaved(draft, course, purpose);
          setView("dashboard");
          return id;
        }}
        onMarkOpened={(id) =>
          persistHistory(
            history.map((e) =>
              e.id === id ? { ...e, status: "awaiting_reply" } : e,
            ),
          )
        }
        onCancel={() => setView("dashboard")}
      />
    );
  }

  if (view === "detail" && detailEntry) {
    return (
      <EmailDetail
        entry={detailEntry}
        onBack={() => {
          setView("dashboard");
          setDetailEntry(null);
        }}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="mt-20 space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Track and manage your emails to professors
        </p>
        <button
          type="button"
          onClick={() => setView("compose")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-sm">
          <Plus className="w-4 h-4" />
          Compose New
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Sparkles className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalDrafts}</p>
            <p className="text-xs text-gray-500">Generated Drafts</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalPending}</p>
            <p className="text-xs text-gray-500">Pending Action</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Send className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalOpened}</p>
            <p className="text-xs text-gray-500">Sent</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Hourglass className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalAwaiting}</p>
            <p className="text-xs text-gray-500">Awaiting Reply</p>
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            Recent Emails
          </h2>
          {history.length > 0 && (
            <span className="text-xs text-gray-400">
              {history.length} record{history.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium">No emails yet</p>
            <p className="text-xs mt-1">
              Click &quot;Compose New&quot; to generate your first email.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {history.map((entry) => {
              const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.sent;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDetailEntry(entry);
                      setView("detail");
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 transition flex items-center gap-4">
                    {/* Course badge */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-teal-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-teal-700">
                          {entry.courseCode}
                        </span>
                        <span className="text-xs text-gray-500">
                          &bull; {entry.purpose}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {entry.courseName}
                      </p>
                      <p className="text-xs text-gray-400">
                        To: {entry.professor} &bull;{" "}
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>

                    {/* Status */}
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <cfg.Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>

                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
