import { z } from "zod";
import type { Scene } from "./schemas";
import {
  initialSceneState,
  maxSceneStep,
  sceneControls,
  type SceneState,
} from "./simulation";
import { timelineEvents } from "./models";
const base = { version: z.literal(1) };
const empty = z.object({}).strict();
const sceneAction = <T extends string, P extends z.ZodType>(
  type: T,
  payload: P,
) =>
  z
    .object({
      ...base,
      type: z.literal(type),
      target: z.literal("scene"),
      payload,
    })
    .strict();
export const sceneActionSchema = z.discriminatedUnion("type", [
  sceneAction("select", z.object({ id: z.string().min(1).max(40) }).strict()),
  sceneAction(
    "set_parameter",
    z
      .object({ key: z.string().min(1).max(40), value: z.number().finite() })
      .strict(),
  ),
  ...(
    ["next_step", "previous_step", "play", "pause", "reset", "replay"] as const
  ).map((type) => sceneAction(type, empty)),
  sceneAction(
    "set_step",
    z.object({ step: z.number().int().min(0).max(1152) }).strict(),
  ),
  sceneAction(
    "set_speed",
    z
      .object({ speed: z.union([z.literal(0.5), z.literal(1), z.literal(2)]) })
      .strict(),
  ),
  sceneAction("compare", z.object({ enabled: z.boolean() }).strict()),
  z
    .object({
      ...base,
      type: z.literal("change_layer"),
      target: z.literal("layers"),
      payload: z
        .object({ id: z.string().min(1).max(32), visible: z.boolean() })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("fit_view"),
      target: z.literal("view"),
      payload: empty,
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("set_view"),
      target: z.literal("view"),
      payload: z
        .object({
          zoom: z.number().min(1).max(3),
          x: z.number().min(-960).max(960),
          y: z.number().min(-960).max(960),
        })
        .strict(),
    })
    .strict(),
]);
export type SceneAction = z.infer<typeof sceneActionSchema>;
export function selectableIds(scene: Scene, state: SceneState): string[] {
  switch (scene.type) {
    case "concept-map":
    case "process-diagram":
      return scene.config.nodes.map((n) => n.id);
    case "historical-timeline":
      return timelineEvents(scene).map((e) => e.id);
    case "annotated-illustration":
      return scene.config.frames[state.step].visibleIds.filter(
        (id) =>
          state.layers?.[
            scene.config.regions.find((r) => r.id === id)!.layer
          ] !== false,
      );
    case "spatial-explorer":
      return scene.config.points.map((p) => p.id);
    case "data-explorer":
      return scene.config.rows.map((r) => r.id);
    case "dna-replication":
      return Array.from(
        { length: scene.config.sequence.length },
        (_, i) => `base-${i}`,
      );
    case "task-scheduler":
      return Array.from(
        { length: state.parameters.partitions },
        (_, i) => `task-${i}`,
      );
    default:
      return [];
  }
}
export const supportsView = (scene: Scene) =>
  ["concept-map", "spatial-explorer", "annotated-illustration"].includes(
    scene.type,
  );
export const supportsComparison = (scene: Scene) =>
  ["supply-demand", "task-scheduler", "historical-timeline"].includes(
    scene.type,
  );
export function transition(
  scene: Scene,
  state: SceneState,
  input: unknown,
): { ok: boolean; state: SceneState; feedback: string } {
  const parsed = sceneActionSchema.safeParse(input);
  const fail = (feedback: string) => ({ ok: false, state, feedback });
  if (!parsed.success)
    return fail("Unsupported action or invalid payload. Nothing changed.");
  const action = parsed.data,
    p = action.payload as Record<string, unknown>,
    next = structuredClone(state),
    max = maxSceneStep(scene, state);
  switch (action.type) {
    case "set_parameter": {
      const control = sceneControls(scene).find((c) => c.key === p.key),
        value = p.value as number;
      if (
        !control ||
        value < control.min ||
        value > control.max ||
        (control.step === 1 && !Number.isInteger(value))
      )
        return fail("Parameter is unsupported or outside its allowed bounds.");
      next.parameters[control.key] = value;
      next.step = ["task-scheduler", "data-explorer"].includes(scene.type)
        ? 0
        : Math.min(next.step, maxSceneStep(scene, next));
      next.playing = false;
      if (next.selected && !selectableIds(scene, next).includes(next.selected))
        next.selected = null;
      break;
    }
    case "select": {
      if (!selectableIds(scene, state).includes(p.id as string))
        return fail("The selected element is not available in this scene.");
      next.selected = p.id as string;
      next.playing = false;
      if (scene.type === "process-diagram")
        next.step = scene.config.nodes.findIndex((n) => n.id === p.id);
      if (scene.type === "historical-timeline")
        next.step = timelineEvents(scene).findIndex((n) => n.id === p.id);
      break;
    }
    case "set_step":
      if ((p.step as number) > max)
        return fail("Step exceeds this scene’s bounds.");
      next.step = p.step as number;
      next.playing = false;
      break;
    case "next_step":
    case "previous_step":
      if (!max) return fail("This scene has no ordered steps.");
      next.step = Math.max(
        0,
        Math.min(max, next.step + (action.type === "next_step" ? 1 : -1)),
      );
      next.playing = false;
      break;
    case "play":
      if (!max || scene.type === "probability")
        return fail("Playback is not supported by this scene.");
      if (next.step >= max) next.step = 0;
      next.playing = true;
      break;
    case "pause":
      next.playing = false;
      break;
    case "reset":
      return {
        ok: true,
        state: initialSceneState(scene),
        feedback: "Scene reset to its starting settings.",
      };
    case "replay":
      if (!max) return fail("This scene has no sequence to replay.");
      next.step = 0;
      next.playing = false;
      break;
    case "set_speed":
      if (!max) return fail("This scene has no playback speed.");
      next.speed = p.speed as number;
      break;
    case "compare":
      if (!supportsComparison(scene))
        return fail("Comparison is unavailable for this scene.");
      next.comparison = p.enabled as boolean;
      break;
    case "change_layer":
      if (!Object.hasOwn(next.layers || {}, p.id as string))
        return fail("Unknown visual layer.");
      next.layers![p.id as string] = p.visible as boolean;
      break;
    case "fit_view":
      if (!supportsView(scene))
        return fail("View controls are unavailable for this scene.");
      next.view = { zoom: 1, x: 0, y: 0 };
      break;
    case "set_view":
      if (!supportsView(scene))
        return fail("View controls are unavailable for this scene.");
      next.view = {
        zoom: p.zoom as number,
        x: p.x as number,
        y: p.y as number,
      };
      break;
    default:
      return fail("Unknown action.");
  }
  if (scene.type === "historical-timeline")
    next.selected = timelineEvents(scene)[next.step].id;
  if (scene.type === "process-diagram")
    next.selected = scene.config.nodes[next.step].id;
  if (next.step >= maxSceneStep(scene, next)) next.playing = false;
  return {
    ok: true,
    state: next,
    feedback:
      action.type === "set_parameter"
        ? "Calculated outcome updated."
        : action.type === "select"
          ? "Selected element details updated."
          : action.type === "set_view"
            ? "View updated."
            : `Scene ${action.type.replaceAll("_", " ")} applied.`,
  };
}
