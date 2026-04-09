import { useRef, useEffect } from "react";
import { Send, Mic, MicOff, VolumeX } from "lucide-react";
import { WaveformVisualizer } from "./WaveformVisualizer";

export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  // Voice props (wired up in Phase 2 & 3; safe to omit until then)
  isRecording = false,
  onToggleRecording = () => {},
  isSpeaking = false,
  onStopSpeaking = () => {},
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 px-4 py-3">
      {/* ── "Stop Speaking" pill — visible only while AI is speaking ── */}
      {isSpeaking && (
        <div className="mb-2 flex justify-center">
          <button
            onClick={onStopSpeaking}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-medium hover:bg-amber-100 active:bg-amber-200 transition-colors shadow-sm">
            <VolumeX className="w-3.5 h-3.5" />
            Stop Speaking
          </button>
        </div>
      )}

      {/* ── Main input row ── */}
      <div
        className={`flex items-end gap-3 bg-gray-50 border rounded-2xl px-4 py-3 transition-all ${
          isRecording
            ? "border-red-400 ring-2 ring-red-100"
            : "border-gray-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100"
        }`}>
        {/* Textarea OR waveform+status while recording */}
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 min-h-7">
            <WaveformVisualizer isActive />
            <span className="text-sm text-red-500 font-medium animate-pulse select-none">
              Listening…
            </span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your studies… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed disabled:opacity-60"
          />
        )}

        {/* ── Send button ── */}
        <button
          onClick={onSend}
          disabled={isLoading || (!value.trim() && !isRecording)}
          className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
          <Send className="w-4 h-4" />
        </button>

        {/* ── Mic button ── */}
        <button
          onClick={onToggleRecording}
          disabled={isLoading}
          title={isRecording ? "Stop recording" : "Start voice input"}
          aria-label={isRecording ? "Stop recording" : "Start voice input"}
          className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
            isRecording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}>
          {/* Expanding pulse ring shown only while recording */}
          {isRecording && (
            <span className="absolute inset-0 rounded-xl bg-red-400 animate-pulse-ring" />
          )}
          {isRecording ? (
            <MicOff className="w-4 h-4 relative z-10" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        UniMate AI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
