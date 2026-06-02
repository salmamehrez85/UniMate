import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  ExternalLink,
  Eye,
  FileText,
  Image,
  LoaderCircle,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  deleteLecture,
  getLectureUrl,
  uploadLecture,
} from "../../services/courseService";

const MAX_FILE_SIZE_MB = 50;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LectureIcon({ mimeType }) {
  if (mimeType === "application/pdf")
    return <FileText className="w-8 h-8 text-red-500 shrink-0" />;
  return <Image className="w-8 h-8 text-blue-500 shrink-0" />;
}

/* ── Preview Modal ─────────────────────────────────────────────────── */
function PreviewModal({ lecture, onClose }) {
  const { t } = useTranslation();
  const url = getLectureUrl(lecture.filename);
  const isImage = lecture.mimeType?.startsWith("image/");
  const isPdf = lecture.mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4 overflow-x-hidden">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm md:max-w-2xl lg:max-w-5xl flex flex-col overflow-hidden max-h-[95vh] md:max-h-[90vh]"
        style={{ height: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {isPdf ? (
              <FileText className="w-5 h-5 text-red-500 shrink-0" />
            ) : (
              <Image className="w-5 h-5 text-blue-500 shrink-0" />
            )}
            <p className="font-semibold text-gray-900 truncate text-sm">
              {lecture.originalName}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition">
              <ExternalLink className="w-4 h-4" />
              {t("courseDetails.lectures.openFile")}
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {isPdf && (
            <iframe
              src={`${url}#toolbar=1&navpanes=1`}
              title={lecture.originalName}
              className="w-full h-full border-0"
            />
          )}
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={url}
                alt={lecture.originalName}
                className="max-w-full max-h-full object-contain rounded-lg shadow"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LecturesTab({ course, onCourseUpdate }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // lecture id
  const [previewLecture, setPreviewLecture] = useState(null); // lecture obj

  // Disable body scroll when delete modal is open
  useEffect(() => {
    if (deleteConfirm) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [deleteConfirm]);

  const lectures = course.lectures || [];

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = "";

    // Validate size client-side
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setUploadError(
          t("courseDetails.lectures.fileTooLarge", { max: MAX_FILE_SIZE_MB }),
        );
        return;
      }
    }

    setUploadError("");
    setUploading(true);

    try {
      let updatedCourse = { ...course };
      for (const file of files) {
        const res = await uploadLecture(course._id, file);
        updatedCourse = {
          ...updatedCourse,
          lectures: [...(updatedCourse.lectures || []), res.lecture],
        };
      }
      onCourseUpdate(updatedCourse);
    } catch (err) {
      setUploadError(err.message || t("courseDetails.lectures.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (lectureId) => {
    setDeleteConfirm(null);
    setDeletingId(lectureId);
    try {
      await deleteLecture(course._id, lectureId);
      onCourseUpdate({
        ...course,
        lectures: lectures.filter((l) => l.id !== lectureId),
      });
    } catch (err) {
      setUploadError(err.message || t("courseDetails.lectures.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {t("courseDetails.lectures.title")}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {t("courseDetails.lectures.subtitle")}
          </p>
        </div>

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed">
          {uploading ? (
            <LoaderCircle className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading
            ? t("courseDetails.lectures.uploading")
            : t("courseDetails.lectures.uploadButton")}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Drop-zone hint */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-xl p-8 text-center transition group disabled:opacity-50 disabled:cursor-not-allowed">
        <Upload className="w-8 h-8 text-gray-300 group-hover:text-teal-400 mx-auto mb-2 transition" />
        <p className="text-sm font-medium text-gray-500 group-hover:text-teal-600 transition">
          {t("courseDetails.lectures.dropzone")}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {t("courseDetails.lectures.dropzoneHint")}
        </p>
      </button>

      {/* Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {uploadError}
        </div>
      )}

      {/* Empty state */}
      {lectures.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {t("courseDetails.lectures.empty")}
          </p>
        </div>
      )}

      {/* File list */}
      {lectures.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {lectures.map((lecture) => {
            const url = getLectureUrl(lecture.filename);
            const isImage = lecture.mimeType?.startsWith("image/");
            return (
              <li
                key={lecture.id}
                className="flex items-center gap-4 py-3 group">
                {/* Thumbnail / icon — click to preview */}
                <button
                  type="button"
                  onClick={() => setPreviewLecture(lecture)}
                  className="shrink-0 focus:outline-none">
                  {isImage ? (
                    <img
                      src={url}
                      alt={lecture.originalName}
                      className="w-10 h-10 rounded object-cover border border-gray-200 hover:opacity-80 transition"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-red-500 hover:text-red-600 transition" />
                  )}
                </button>

                {/* Info — click to preview */}
                <button
                  type="button"
                  onClick={() => setPreviewLecture(lecture)}
                  className="flex-1 min-w-0 text-left focus:outline-none">
                  <p
                    className="text-sm font-medium text-gray-900 truncate hover:text-teal-700 transition"
                    title={lecture.originalName}>
                    {lecture.originalName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatBytes(lecture.size)} ·{" "}
                    {new Date(lecture.uploadedAt).toLocaleDateString()}
                  </p>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  {/* Preview */}
                  <button
                    type="button"
                    title={t("courseDetails.lectures.previewFile")}
                    onClick={() => setPreviewLecture(lecture)}
                    className="p-1.5 rounded-lg hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition">
                    <Eye className="w-4 h-4" />
                  </button>
                  {/* Open in new tab */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("courseDetails.lectures.openFile")}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {/* Delete */}
                  <button
                    type="button"
                    title={t("courseDetails.lectures.deleteFile")}
                    disabled={deletingId === lecture.id}
                    onClick={() => setDeleteConfirm(lecture.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition disabled:opacity-50">
                    {deletingId === lecture.id ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirm &&
        createPortal(
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-2 md:p-4 overflow-hidden overflow-x-hidden">
            <div className="bg-white rounded-xl shadow-lg max-w-sm md:max-w-md w-full p-4 md:p-6 max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-primary-900 mb-2">
                {t("courseDetails.lectures.deleteTitle")}
              </h3>
              <p className="text-gray-600 mb-4">
                {t("courseDetails.lectures.deleteConfirm")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                  {t("courseDetails.lectures.deleteButton")}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition">
                  {t("courseDetails.lectures.cancel")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── Preview Modal ── */}
      {previewLecture && (
        <PreviewModal
          lecture={previewLecture}
          onClose={() => setPreviewLecture(null)}
        />
      )}
    </div>
  );
}
