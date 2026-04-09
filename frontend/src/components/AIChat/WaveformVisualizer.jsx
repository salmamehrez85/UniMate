/**
 * WaveformVisualizer
 *
 * Phase 1 – CSS-animated bars that signal "I am listening."
 * Phase 2 will replace the static delays with live AnalyserNode data so each
 * bar reacts to the actual microphone volume.
 *
 * Props
 *  isActive  – true while recording; bars animate, false shows flat stubs
 *  barCount  – number of bars (default 12)
 */

const BASE_DELAYS = [
  0, 0.1, 0.2, 0.3, 0.4, 0.35, 0.25, 0.15, 0.05, 0.2, 0.3, 0.1,
];
const BASE_DURATIONS = [
  0.8, 0.9, 0.7, 1.0, 0.85, 0.75, 0.95, 0.8, 0.9, 0.7, 1.0, 0.85,
];

export function WaveformVisualizer({ isActive, barCount = 12 }) {
  return (
    <div
      className="flex items-center gap-0.75"
      aria-hidden="true"
      style={{ height: "28px" }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={`w-0.75 rounded-full bg-red-500 transition-all duration-200 ${
            isActive ? "waveform-bar" : ""
          }`}
          style={{
            height: isActive ? "100%" : "4px",
            animationDelay: isActive
              ? `${BASE_DELAYS[i % BASE_DELAYS.length]}s`
              : undefined,
            animationDuration: isActive
              ? `${BASE_DURATIONS[i % BASE_DURATIONS.length]}s`
              : undefined,
          }}
        />
      ))}
    </div>
  );
}
