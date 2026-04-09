/**
 * WaveformVisualizer
 *
 * Phase 2 – Audio-reactive bars driven by live AnalyserNode data.
 *
 * Props
 *  isActive    – true while recording
 *  barHeights  – array of 0→1 floats from useSpeechRecognition (live mic data)
 *                If omitted or all-zero, falls back to the CSS bounce animation
 *  barCount    – number of bars (default 12)
 */

// CSS animation fallbacks (used when AnalyserNode data is unavailable)
const BASE_DELAYS = [
  0, 0.1, 0.2, 0.3, 0.4, 0.35, 0.25, 0.15, 0.05, 0.2, 0.3, 0.1,
];
const BASE_DURATIONS = [
  0.8, 0.9, 0.7, 1.0, 0.85, 0.75, 0.95, 0.8, 0.9, 0.7, 1.0, 0.85,
];
// Container height in px — bars scale within this
const CONTAINER_H = 28;
// Minimum rendered bar height so bars never fully disappear during silence
const MIN_BAR_PX = 3;

export function WaveformVisualizer({ isActive, barHeights, barCount = 12 }) {
  // Use live data when the array has actual signal (any bar > near-zero threshold)
  const hasLiveData =
    isActive &&
    Array.isArray(barHeights) &&
    barHeights.length > 0 &&
    barHeights.some((h) => h > 0.04);

  return (
    <div
      className="flex items-center gap-0.75"
      aria-hidden="true"
      style={{ height: `${CONTAINER_H}px` }}>
      {Array.from({ length: barCount }).map((_, i) => {
        const liveH = hasLiveData
          ? Math.max(
              MIN_BAR_PX,
              barHeights[i % barHeights.length] * CONTAINER_H,
            )
          : null;

        return (
          <div
            key={i}
            className={`w-0.75 rounded-full bg-red-500 ${
              // Only apply CSS animation class when we don't have live data
              !hasLiveData && isActive
                ? "waveform-bar"
                : "transition-[height] duration-75"
            }`}
            style={{
              height: hasLiveData
                ? `${liveH}px`
                : isActive
                  ? "100%"
                  : `${MIN_BAR_PX}px`,
              animationDelay:
                !hasLiveData && isActive
                  ? `${BASE_DELAYS[i % BASE_DELAYS.length]}s`
                  : undefined,
              animationDuration:
                !hasLiveData && isActive
                  ? `${BASE_DURATIONS[i % BASE_DURATIONS.length]}s`
                  : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
