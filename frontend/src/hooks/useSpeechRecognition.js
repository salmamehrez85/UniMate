/**
 * useSpeechRecognition
 *
 * Phase 2 – Web Speech API + AnalyserNode waveform
 *
 * Usage:
 *   const { isRecording, barHeights, toggle, stop } = useSpeechRecognition({
 *     onTranscript: (text) => setInput(text),
 *   });
 *
 * API:
 *   toggle(prefixText?)  – start (passing prior input to prepend) or stop
 *   stop()               – force-stop from outside (e.g. on page unmount)
 *   isRecording          – boolean
 *   barHeights           – Float32Array-like: 12 values 0→1 driven by mic volume
 */

import { useRef, useState, useCallback, useEffect } from "react";

const BAR_COUNT = 12;
const SILENCE_HEIGHTS = Array(BAR_COUNT).fill(0.05);

export function useSpeechRecognition({ onTranscript } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [barHeights, setBarHeights] = useState(SILENCE_HEIGHTS);

  // Stable ref so callbacks don't go stale
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  // ── AnalyserNode waveform ────────────────────────────────────────
  const startAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // 32 frequency bins — lightweight
      analyserRef.current = analyser;

      ctx.createMediaStreamSource(stream).connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        // Map 32 bins → 12 bars evenly
        const heights = Array.from({ length: BAR_COUNT }, (_, i) => {
          const idx = Math.floor((i / BAR_COUNT) * data.length);
          return data[idx] / 255;
        });
        setBarHeights(heights);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // Microphone permission denied or unavailable.
      // SpeechRecognition still works; waveform falls back to CSS animation.
    }
  }, []);

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setBarHeights(SILENCE_HEIGHTS);
  }, []);

  // ── Start ────────────────────────────────────────────────────────
  const start = useCallback(
    (prefixText = "") => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert(
          "Voice input requires Chrome or Edge. Your current browser does not support the Web Speech API.",
        );
        return;
      }

      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      recognitionRef.current = rec;

      // Accumulate confirmed finals across multiple result events
      let accumulated = "";

      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            accumulated += t + " ";
          } else {
            interim += t;
          }
        }
        // Combine prefixText + confirmed + interim → live input value
        const live = (accumulated + interim).trimStart();
        const full = prefixText ? `${prefixText} ${live}` : live;
        onTranscriptRef.current?.(full);
      };

      rec.onerror = (e) => {
        // "aborted" fires when we call rec.stop() ourselves — ignore it
        if (e.error !== "aborted") {
          console.warn("[Voice] SpeechRecognition error:", e.error);
        }
        stopImpl();
      };

      rec.onend = () => {
        setIsRecording(false);
        stopAnalyser();
      };

      rec.start();
      setIsRecording(true);
      startAnalyser();
    },
    [startAnalyser, stopAnalyser],
  );

  // ── Stop ─────────────────────────────────────────────────────────
  // Defined as a plain function so it can be referenced inside start() above
  // without creating a circular hook dependency.
  const stopImpl = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    stopAnalyser();
  }, [stopAnalyser]);

  // ── Toggle ───────────────────────────────────────────────────────
  const toggle = useCallback(
    (prefixText = "") => {
      if (isRecording) stopImpl();
      else start(prefixText);
    },
    [isRecording, start, stopImpl],
  );

  // ── Cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopAnalyser();
    };
  }, [stopAnalyser]);

  return { isRecording, barHeights, toggle, stop: stopImpl };
}
