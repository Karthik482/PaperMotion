"use client";
import { useEffect, useId, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import type { Scene } from "@/lib/scenes/schemas";
import {
  maxSceneStep,
  restoreSceneState,
  sceneControls,
} from "@/lib/scenes/simulation";
import {
  transition,
  supportsView,
  supportsComparison,
} from "@/lib/scenes/actions";
import { useReducedMotion } from "@/components/layout/useReducedMotion";
import { sceneRegistry, formatNumber } from "./SceneRegistry";
import { useSceneSession, type TutorBinding } from "./useSceneSession";
import { createPortal } from "react-dom";
import { TutorPanel } from "@/components/tutor/TutorPanel";
import { sceneActionSchema } from "@/lib/scenes/actions";
export function PlayerCore({
  scene,
  storageKey,
  detailsTarget,
  tutor,
  tutorTarget,
}: {
  scene: Scene;
  storageKey: string;
  detailsTarget?: HTMLElement | null;
  tutor?: TutorBinding;
  tutorTarget?: HTMLElement | null;
}) {
  const session = useSceneSession(scene, tutor);
  const { state, setState } = session;
  const [ready, setReady] = useState(false),
    [feedback, setFeedback] = useState("");
  const reduced = useReducedMotion(),
    uid = useId(),
    signature = JSON.stringify(scene),
    key = `scene-player:v2:${storageKey}`,
    max = maxSceneStep(scene, state),
    playing = !!state.playing;
  const canPlay = max > 0 && scene.type !== "probability";
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "null");
      if (stored?.signature === signature)
        setState(restoreSceneState(scene, stored.state));
    } catch {}
    setReady(true);
  }, [key, signature]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify({ signature, state }));
      } catch {}
  }, [key, signature, state, ready]);
  useEffect(() => {
    if (reduced) setState((s) => ({ ...s, playing: false }));
  }, [reduced]);
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = setInterval(
      () =>
        setState((s) => {
          const next = transition(scene, s, {
            version: 1,
            type: "next_step",
            target: "scene",
            payload: {},
          }).state;
          if (next.step < maxSceneStep(scene, next)) next.playing = true;
          return next;
        }),
      650 / (state.speed || 1),
    );
    return () => clearInterval(timer);
  }, [playing, reduced, state.speed, signature]);
  function send(input: unknown) {
    if (reduced && (input as { type?: string })?.type === "play") {
      setFeedback("Reduced motion is enabled. Use manual stepping.");
      return;
    }
    const before = session.ref.current;
    const result = transition(scene, before, input);
    if (result.ok) setState(result.state);
    const parsed = sceneActionSchema.safeParse(input);
    if (result.ok && parsed.success && parsed.data.type === "set_parameter")
      session.remember(before, result.state, [parsed.data]);
    setFeedback(result.feedback);
  }
  const action = (
    type: string,
    payload: Record<string, unknown> = {},
    target = "scene",
  ) => send({ version: 1, type, target, payload });
  const view = state.view || { zoom: 1, x: 0, y: 0 };
  const Renderer = sceneRegistry[scene.type];
  const fidelity =
    scene.type === "historical-timeline"
      ? "Source-backed chronology"
      : [
            "dna-replication",
            "annotated-illustration",
            "process-diagram",
            "concept-map",
            "spatial-explorer",
          ].includes(scene.type)
        ? "Illustrative model"
        : ["task-scheduler", "supply-demand"].includes(scene.type)
          ? "Simplified calculated model"
          : "Exact calculation";
  return (
    <section
      className="universal-scene visualization-card"
      aria-label={`Interactive scene: ${scene.title}`}
      data-scene-type={scene.type}
    >
      <div className="viz-toolbar">
        <span>{fidelity}</span>
        <span>{scene.type.replaceAll("-", " ")}</span>
      </div>
      <div className="scene-intro">
        <h3>{scene.title}</h3>
        <p>{scene.description}</p>
      </div>
      <Renderer
        scene={scene}
        state={state}
        onSelect={(id) => action("select", { id })}
        onAction={send}
        detailsTarget={detailsTarget}
      />
      {supportsView(scene) && (
        <div className="engine-view-controls" aria-label="View controls">
          <button
            onClick={() =>
              action(
                "set_view",
                { ...view, zoom: Math.min(3, view.zoom + 0.25) },
                "view",
              )
            }
            disabled={view.zoom >= 3}
          >
            Zoom in
          </button>
          <button
            onClick={() =>
              action(
                "set_view",
                { ...view, zoom: Math.max(1, view.zoom - 0.25) },
                "view",
              )
            }
            disabled={view.zoom <= 1}
          >
            Zoom out
          </button>
          {[
            ["Pan left", -80, 0],
            ["Pan right", 80, 0],
            ["Pan up", 0, -80],
            ["Pan down", 0, 80],
          ].map(([label, dx, dy]) => (
            <button
              key={label}
              onClick={() =>
                action(
                  "set_view",
                  {
                    ...view,
                    x: Math.max(-960, Math.min(960, view.x + Number(dx))),
                    y: Math.max(-960, Math.min(960, view.y + Number(dy))),
                  },
                  "view",
                )
              }
            >
              {label}
            </button>
          ))}
          <button onClick={() => action("fit_view", {}, "view")}>
            Fit view
          </button>
          <output aria-label="Zoom level">
            {Math.round(view.zoom * 100)}%
          </output>
        </div>
      )}
      {Object.keys(state.layers || {}).length > 0 && (
        <fieldset className="engine-layers">
          <legend>Visible layers</legend>
          {Object.entries(state.layers!).map(([id, visible]) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) =>
                  action(
                    "change_layer",
                    { id, visible: e.target.checked },
                    "layers",
                  )
                }
              />
              {id === "enzymes" ? "Enzyme annotations" : id}
            </label>
          ))}
        </fieldset>
      )}
      {supportsComparison(scene) && (
        <button
          className="engine-compare-button"
          aria-pressed={!!state.comparison}
          onClick={() => action("compare", { enabled: !state.comparison })}
        >
          {scene.type === "historical-timeline"
            ? "Compare timeline tracks"
            : "Compare with starting settings"}
        </button>
      )}
      <div className="scene-controls">
        {sceneControls(scene).map((control) => (
          <label key={control.key} htmlFor={`${uid}-${control.key}`}>
            <span>
              {control.label}
              <output>
                {formatNumber(state.parameters[control.key])} {control.unit}
              </output>
            </span>
            <input
              id={`${uid}-${control.key}`}
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={state.parameters[control.key]}
              onChange={(e) =>
                action("set_parameter", {
                  key: control.key,
                  value: Number(e.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      {max > 0 && (
        <label className="scene-step-control" htmlFor={`${uid}-step`}>
          <span>
            {scene.type === "gradient-descent"
              ? "Iterations"
              : scene.type === "probability"
                ? "Selected successes"
                : scene.type === "process-diagram"
                  ? "Current stage"
                  : "Execution step"}
            <output>
              {state.step} / {max}
            </output>
          </span>
          <input
            id={`${uid}-step`}
            type="range"
            min="0"
            max={max}
            step="1"
            value={state.step}
            onChange={(e) =>
              action("set_step", { step: Number(e.target.value) })
            }
          />
        </label>
      )}
      <div className="playback">
        {canPlay && !reduced && (
          <button
            className="play-button"
            onClick={() => action(playing ? "pause" : "play")}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
            {playing ? "Pause simulation" : "Play simulation"}
          </button>
        )}
        {max > 0 && (
          <>
            <button
              className="reset-button"
              disabled={state.step <= 0}
              onClick={() => action("previous_step")}
            >
              <ArrowLeft size={16} />
              Step backward
            </button>
            <button
              className="reset-button"
              disabled={state.step >= max}
              onClick={() => action("next_step")}
            >
              <ArrowRight size={16} />
              Step forward
            </button>
          </>
        )}
        <button className="reset-button" onClick={() => action("reset")}>
          <RotateCcw size={16} />
          Reset scene
        </button>
        {canPlay && (
          <button className="reset-button" onClick={() => action("replay")}>
            Replay from start
          </button>
        )}
        {canPlay && (
          <label className="playback-speed">
            Speed
            <select
              aria-label="Playback speed"
              value={state.speed || 1}
              onChange={(e) =>
                action("set_speed", { speed: Number(e.target.value) })
              }
            >
              <option value="0.5">0.5×</option>
              <option value="1">1×</option>
              <option value="2">2×</option>
            </select>
          </label>
        )}
      </div>
      <p className="engine-action-feedback" role="status">
        {feedback || "Explore the scene using its controls."}
      </p>
      <details className="scene-assumptions">
        <summary>Model assumptions &amp; limits</summary>
        <ul>
          {scene.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        {reduced && (
          <p>Reduced motion is on. Advance manually with the controls.</p>
        )}
      </details>
      {tutor &&
        (() => {
          const panel = (
            <TutorPanel
              binding={tutor}
              revision={session.revision}
              capture={() => session.capture("explore")}
              apply={session.apply}
              suggestions={[
                "What assumptions are we making?",
                "Why did the result change?",
                "Show me the next step.",
              ]}
            />
          );
          return tutorTarget ? createPortal(panel, tutorTarget) : panel;
        })()}
    </section>
  );
}
