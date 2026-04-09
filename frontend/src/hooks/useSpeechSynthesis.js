/**
 * useSpeechSynthesis
 *
 * Phase 3 – Text-to-Speech via the browser's Web Speech Synthesis API.
 * Zero cost, zero latency, works in all modern browsers.
 * Phase 4 could swap the `speak()` body for an ElevenLabs/OpenAI TTS call.
 *
 * Usage:
 *   const { isSpeaking, speak, stop } = useSpeechSynthesis();
 *
 *   speak("Hello!")      – strips markdown, speaks aloud, sets isSpeaking=true
 *   stop()               – cancels playback, sets isSpeaking=false
 */

import { useState, useCallback, useEffect, useRef } from "react";

// ── Markdown stripper ────────────────────────────────────────────────────────
// The AI replies in markdown; reading raw syntax aloud sounds terrible.
function stripMarkdown(text) {
  return (
    text
      // Fenced code blocks → omit entirely (code is not worth reading aloud)
      .replace(/```[\s\S]*?```/g, " code block omitted. ")
      // Inline code
      .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
      // Headers  (# / ## / ###)
      .replace(/^#{1,6}\s+/gm, "")
      // Bold + italic  ***text*** / **text** / *text* / __text__ / _text_
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
      // Links  [label](url) → label
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Images  ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Blockquotes
      .replace(/^>\s*/gm, "")
      // Unordered list markers
      .replace(/^[\s]*[-*+]\s+/gm, "")
      // Ordered list markers (1. / 2.)
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Collapse multiple newlines into one pause
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      // Trim excessive whitespace
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(
    (text) => {
      if (!window.speechSynthesis) return;

      // Cancel any ongoing speech first
      stop();

      const clean = stripMarkdown(text);
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utteranceRef.current = utterance;

      // Voice selection — prefer a natural English voice when available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.toLowerCase().includes("google") ||
            v.name.toLowerCase().includes("natural") ||
            v.name.toLowerCase().includes("enhanced") ||
            v.name.toLowerCase().includes("premium")),
      );
      if (preferred) utterance.voice = preferred;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      // Chrome bug: voices may not be loaded yet on first call.
      // Using a small timeout ensures getVoices() has resolved.
      setTimeout(() => {
        // Re-pick voice after the timeout to be safe
        const v2 = window.speechSynthesis.getVoices();
        const best = v2.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.toLowerCase().includes("google") ||
              v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("enhanced") ||
              v.name.toLowerCase().includes("premium")),
        );
        if (best) utterance.voice = best;
        window.speechSynthesis.speak(utterance);
      }, 50);
    },
    [stop],
  );

  // Cancel on unmount so audio doesn't play after page navigation
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { isSpeaking, speak, stop };
}
