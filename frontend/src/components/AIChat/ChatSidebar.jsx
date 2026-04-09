import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Trash2,
  Plus,
  Clock,
  Pencil,
  Check,
  X,
} from "lucide-react";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function SessionItem({ session, isActive, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = (e) => {
    e.stopPropagation();
    setDraft(session.title);
    setEditing(true);
  };

  const confirmEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== session.title) {
      onRename(session._id, trimmed);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(session.title);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmEdit();
    }
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div
      onClick={() => !editing && onSelect(session._id)}
      className={`group mx-2 mb-1 flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? "bg-primary-50 border border-primary-100"
          : "hover:bg-gray-50"
      }`}>
      <MessageSquare
        className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-primary-600" : "text-gray-400"}`}
      />

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            maxLength={100}
            className="w-full text-xs font-medium text-primary-700 bg-white border border-primary-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary-400"
          />
        ) : (
          <p
            className={`text-xs font-medium truncate ${isActive ? "text-primary-700" : "text-gray-700"}`}>
            {session.title}
          </p>
        )}
        {!editing && (
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-gray-300" />
            <span className="text-[10px] text-gray-400">
              {timeAgo(session.updatedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {editing ? (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmEdit();
            }}
            className="p-1 rounded-md hover:bg-primary-50 text-primary-500 transition-all cursor-pointer"
            title="Confirm rename">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              cancelEdit();
            }}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 transition-all cursor-pointer"
            title="Cancel">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 transition-all">
          <button
            onClick={startEdit}
            className="p-1 rounded-md hover:bg-primary-500 hover:text-teal-600 text-gray-400 transition-all cursor-pointer"
            title="Rename chat">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session._id);
            }}
            className="p-1 rounded-md hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all cursor-pointer"
            title="Delete chat">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  isLoading,
}) {
  return (
    <div className="w-64 shrink-0 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary-900">
          Chat History
        </span>
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-100 hover:text-teal-600 hover:bg-primary-200 rounded-lg transition-colors cursor-pointer"
          title="New chat">
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 px-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">
              No saved chats yet. Start a conversation!
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session._id}
              session={session}
              isActive={activeSessionId === session._id}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
              onRename={onRenameSession}
            />
          ))
        )}
      </div>
    </div>
  );
}
