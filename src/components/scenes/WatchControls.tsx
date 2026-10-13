"use client";
import type { useWatch } from "./useWatch";
export function WatchControls({
  watch,
  reduced,
}: {
  watch: ReturnType<typeof useWatch>;
  reduced: boolean;
}) {
  const s = watch.sequence;
  return (
    <div
      className="watch-sequence"
      aria-label="Guided animation"
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          watch.move((s?.index ?? -1) + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          watch.move((s?.index ?? 0) - 1);
        }
      }}
    >
      <div className="watch-caption">
        <span className="eyebrow">
          {s?.timeline.title || "Guided walkthrough"} ·{" "}
          {s ? Math.max(0, s.index + 1) : 0} / {s?.timeline.frames.length || 0}
        </span>
        <p aria-live="polite">
          {s && s.index >= 0
            ? s.timeline.frames[s.index].caption
            : "Play to start a purposeful sequence. Each frame updates the same model used by Explore."}
        </p>
      </div>
      <progress
        aria-label="Animation progress"
        value={s ? Math.max(0, s.index + 1) : 0}
        max={s?.timeline.frames.length || 1}
      />
      <div className="watch-playback">
        <button
          onClick={() => (s?.running ? watch.pause() : watch.play())}
          disabled={reduced}
        >
          {s?.running ? "Pause walkthrough" : "Play walkthrough"}
        </button>
        <button
          onClick={() => watch.move((s?.index ?? 0) - 1)}
          disabled={!s || s.index <= 0}
        >
          Previous frame
        </button>
        <button
          onClick={() => watch.move((s?.index ?? -1) + 1)}
          disabled={!s || s.index >= s.timeline.frames.length - 1}
        >
          Next frame
        </button>
        <button onClick={watch.replay}>Replay walkthrough</button>
        <label>
          Speed{" "}
          <select
            aria-label="Animation speed"
            value={s?.speed || 1}
            onChange={(e) => watch.speed(Number(e.target.value) as 0.5 | 1 | 2)}
          >
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
          </select>
        </label>
      </div>
      <small>
        {reduced
          ? "Reduced motion is on. Use Next frame and Previous frame."
          : "Arrow keys step through focused playback controls. Switching modes preserves the current model; Replay starts the sequence again."}
      </small>
      {watch.error && (
        <p role="status" className="watch-error">
          {watch.error}
        </p>
      )}
    </div>
  );
}
