import type { Scene } from "../scenes/schemas";
import {
  initialSceneState,
  maxSceneStep,
  sceneControls,
  type SceneState,
} from "../scenes/simulation";
import { applyBatch, computedMetrics } from "./context";
import { timelineSchema, type WatchTimeline } from "./schemas";
import { dnaStages } from "../scenes/catalog";
import { timelineEvents } from "../scenes/models";
import type { SceneAction } from "../scenes/actions";
const orderedAction = (step: number): SceneAction => ({
  version: 1,
  type: "set_step",
  target: "scene",
  payload: { step },
});
export function validateTimeline(
  scene: Scene,
  state: SceneState,
  input: unknown,
) {
  const timeline = timelineSchema.parse(input);
  if (timeline.frames.reduce((sum, f) => sum + f.durationMs, 0) > 30000)
    throw new Error("Timeline exceeds total duration limit");
  let candidate = state;
  for (const frame of timeline.frames) {
    if (
      frame.actions.some((a) =>
        ["play", "pause", "replay", "reset", "set_speed"].includes(a.type),
      )
    )
      throw new Error("Playback cannot control itself");
    candidate = applyBatch(scene, candidate, frame.actions);
  }
  return { timeline, finalState: candidate };
}
export function defaultTimeline(
  scene: Scene,
  state: SceneState,
  previous?: SceneState,
): WatchTimeline {
  const frames: WatchTimeline["frames"] = [],
    max = maxSceneStep(scene, state);
  if (scene.type === "supply-demand") {
    const start = previous?.parameters.demandShift ?? scene.config.demandShift,
      end =
        state.parameters.demandShift === start
          ? Math.min(50, start + 10)
          : state.parameters.demandShift;
    for (let i = 0; i <= 10; i++)
      frames.push({
        durationMs: 550,
        caption:
          i === 0
            ? "Start from the comparison demand assumption."
            : "Shift demand; the intersection is recalculated from the curves.",
        actions: [
          {
            version: 1,
            type: "set_parameter",
            target: "scene",
            payload: {
              key: "demandShift",
              value: Math.round(start + ((end - start) * i) / 10),
            },
          },
        ],
      });
  } else if (max > 0) {
    const end =
      scene.type === "gradient-descent"
        ? Math.min(20, Math.max(scene.config.iterations, state.step))
        : max;
    const steps = Array.from({ length: Math.min(24, end + 1) }, (_, i) =>
      Math.round((i * end) / Math.max(1, Math.min(24, end + 1) - 1)),
    );
    for (const step of steps) {
      let caption = "Inspect the computed state at this step.";
      if (scene.type === "dna-replication") caption = dnaStages[step].note;
      else if (scene.type === "historical-timeline") {
        const e = timelineEvents(scene)[step];
        caption = `${e.date}: ${e.description}`;
      } else if (scene.type === "process-diagram")
        caption = scene.config.nodes[step].description.slice(0, 400);
      else if (scene.type === "annotated-illustration")
        caption = scene.config.frames[step].note.slice(0, 400);
      else if (scene.type === "task-scheduler")
        caption =
          step === 0
            ? "The driver schedules partition tasks into available executor slots."
            : step === max
              ? "All stage tasks have finished. Inspect the computed result."
              : step % 2
                ? "Tasks occupy available executor slots."
                : "A task wave has finished; dependent stages wait at a barrier.";
      else if (scene.type === "gradient-descent")
        caption =
          "Use the exact derivative to update the parameter, then calculate its loss.";
      const actions: SceneAction[] = [orderedAction(step)];
      if (scene.type === "dna-replication" && step === 3)
        actions.push({
          version: 1,
          type: "highlight",
          target: "scene",
          payload: { ids: ["dna-leading", "dna-lagging"] },
        });
      frames.push({ actions, caption, durationMs: 800 });
    }
  } else {
    const initial = initialSceneState(scene),
      controls = Object.keys(initial.parameters);
    const ids =
      scene.type === "concept-map"
        ? scene.config.nodes.map((n) => n.id)
        : scene.type === "spatial-explorer"
          ? scene.config.points.map((p) => p.id)
          : [];
    if (ids.length)
      for (const id of ids.slice(0, 12))
        frames.push({
          durationMs: 1000,
          caption:
            "Select this element and inspect its relationships in the contextual explanation.",
          actions: [
            { version: 1, type: "select", target: "scene", payload: { id } },
          ],
        });
    else if (controls.length) {
      const key = scene.type === "vector-transform" ? "angle" : "x",
        control = sceneControls(scene).find((c) => c.key === key)!;
      const start =
          scene.type === "vector-transform"
            ? state.parameters.angle
            : control.min,
        end =
          scene.type === "vector-transform"
            ? Math.min(control.max, start + 90)
            : control.max;
      for (let i = 0; i <= 12; i++)
        frames.push({
          durationMs: 500,
          caption:
            scene.type === "vector-transform"
              ? "Rotate the transformed vector; its components are computed from the matrix and angle."
              : "Move across the domain and evaluate the configured function at the current input.",
          actions: [
            {
              version: 1,
              type: "set_parameter",
              target: "scene",
              payload: {
                key,
                value:
                  Math.round((start + ((end - start) * i) / 12) * 1000) / 1000,
              },
            },
          ],
        });
    }
  }
  const timeline = { version: 1 as const, title: "Guided walkthrough", frames };
  validateTimeline(scene, state, timeline);
  return timeline;
}
export function frameState(
  scene: Scene,
  state: SceneState,
  timeline: WatchTimeline,
  index: number,
) {
  if (!Number.isInteger(index) || index < 0 || index >= timeline.frames.length)
    throw new Error("Invalid timeline index");
  let result = state;
  for (const frame of timeline.frames.slice(0, index + 1))
    result = applyBatch(scene, result, frame.actions);
  return { ...result, playing: false };
}
export function stateDescription(scene: Scene, state: SceneState) {
  return computedMetrics(scene, state)
    .map((m) => `${m.label}: ${m.value}${m.unit ? " " + m.unit : ""}`)
    .join(" · ");
}
