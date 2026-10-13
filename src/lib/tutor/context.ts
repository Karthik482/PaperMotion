import type { Scene } from "../scenes/schemas";
import {
  sceneControls,
  restoreSceneState,
  maxSceneStep,
  type SceneState,
} from "../scenes/simulation";
import {
  selectableIds,
  supportsComparison,
  supportsView,
  transition,
  type SceneAction,
} from "../scenes/actions";
import { sceneOutput } from "../scenes/output";
import {
  dataTrace,
  dnaState,
  equilibrium,
  schedule,
  timelineEvents,
  spatialDistance,
} from "../scenes/models";
import {
  dnaSource,
  dnaStages,
  economicSource,
  sparkSource,
} from "../scenes/catalog";
import { sceneProfiles } from "../scenes/profiles";
import { fingerprint, type TutorSource } from "./schemas";
export type Metric = { label: string; value: number | string; unit?: string };
export function computedMetrics(scene: Scene, state: SceneState): Metric[] {
  const p = state.parameters,
    c = scene.config;
  const old = sceneOutput(scene, state);
  if (old) return old.metrics;
  if (scene.type === "task-scheduler") {
    const c = scene.config,
      m = schedule(
        p.partitions,
        p.executors,
        p.slots,
        p.taskDuration,
        c.stages,
        state.step,
        c.records,
      );
    return [
      { label: "Parallel slots", value: m.capacity },
      { label: "Waves per stage", value: m.waves },
      { label: "Estimated job time", value: m.estimatedTime, unit: "s" },
      { label: "Completed tasks", value: m.completed },
      { label: "Result sum", value: m.result ?? "Pending" },
    ];
  }
  if (scene.type === "supply-demand") {
    const m = equilibrium(
      p.demandIntercept,
      p.demandSlope,
      p.supplyIntercept,
      p.supplySlope,
      p.demandShift,
      p.supplyShift,
    );
    return [
      {
        label: "Equilibrium quantity",
        value: m.feasible ? m.quantity : "No feasible equilibrium",
      },
      {
        label: "Equilibrium price",
        value: m.feasible ? m.price : "Outside nonnegative domain",
      },
    ];
  }
  if (scene.type === "dna-replication") {
    const m = dnaState(scene.config.sequence, state.step);
    return [
      { label: "Mechanism stage", value: m.stage.label },
      { label: "Daughter duplexes", value: m.sealed ? 2 : 0 },
      { label: "Synthesis direction", value: "5′→3′" },
    ];
  }
  if (scene.type === "historical-timeline") {
    const events = timelineEvents(scene),
      event = events[state.step];
    return [
      { label: "Selected event", value: event.label },
      { label: "Date", value: event.date },
      {
        label: "Days since first event",
        value: (Date.parse(event.date) - Date.parse(events[0].date)) / 86400000,
      },
    ];
  }
  if (scene.type === "data-explorer") {
    const trace = dataTrace(scene, state);
    return [
      { label: "Execution step", value: state.step },
      { label: "Output rows", value: trace.output.length },
      {
        label: "Values in output",
        value: trace.output.map((r) => r.value).join(", ") || "None",
      },
    ];
  }
  if (scene.type === "spatial-explorer") {
    const first = scene.config.points[0],
      selected =
        scene.config.points.find((p) => p.id === state.selected) || first;
    return [
      { label: "Selected point", value: selected.label },
      {
        label: "Distance from first point",
        value: spatialDistance(first, selected),
        unit: scene.config.units,
      },
    ];
  }
  if (scene.type === "annotated-illustration")
    return [{ label: "Frame", value: scene.config.frames[state.step].label }];
  if (scene.type === "process-diagram")
    return [{ label: "Stage", value: scene.config.nodes[state.step].label }];
  if ("nodes" in c)
    return [
      {
        label: "Selected concept",
        value: c.nodes.find((n) => n.id === state.selected)?.label || "None",
      },
    ];
  return [];
}
export function capabilityManifest(
  scene: Scene,
  state: SceneState,
  readOnly = false,
) {
  const max = maxSceneStep(scene, state),
    elements = selectableIds(scene, state);
  const actions = readOnly
    ? []
    : [
        "pause",
        "reset",
        ...(elements.length ? ["select", "highlight"] : []),
        ...(sceneControls(scene).length ? ["set_parameter"] : []),
        ...(max
          ? ["set_step", "next_step", "previous_step", "replay", "set_speed"]
          : []),
        ...(max && scene.type !== "probability" ? ["play"] : []),
        ...(supportsComparison(scene) ? ["compare"] : []),
        ...(supportsView(scene) ? ["fit_view", "set_view"] : []),
        ...(Object.keys(state.layers || {}).length ? ["change_layer"] : []),
      ];
  if (
    !readOnly &&
    scene.type === "dna-replication" &&
    !actions.includes("highlight")
  )
    actions.push("highlight");
  return {
    type: scene.type,
    fidelity: sceneProfiles[scene.type].fidelity,
    actions,
    parameters: sceneControls(scene),
    maxStep: max,
    selectable: elements,
    highlightable: [
      ...elements,
      ...(scene.type === "dna-replication"
        ? ["dna-leading", "dna-lagging", "dna-fork"]
        : []),
    ],
    layers: Object.keys(state.layers || {}),
    speed: [0.5, 1, 2],
    view: supportsView(scene),
    assumptions: scene.assumptions,
    actionSemantics: {
      reset:
        "Restore all original configured parameters and the original step. Do not use after a parameter change.",
      replay:
        "Return to the first step while retaining current parameters; does not autoplay.",
      set_parameter:
        "Update a supported parameter; re-evaluate locally and pause playback.",
      navigate_scene:
        "Change to another known lesson step, without modifying its state. Must be the only action.",
    },
    orderedSteps:
      scene.type === "dna-replication"
        ? dnaStages.map((s, step) => ({ step, ...s }))
        : scene.type === "historical-timeline"
          ? timelineEvents(scene).map((e, step) => ({
              step,
              id: e.id,
              label: e.label,
              date: e.date,
            }))
          : scene.type === "process-diagram"
            ? scene.config.nodes.map((n, step) => ({
                step,
                id: n.id,
                label: n.label,
              }))
            : [],
  };
}
export function validatedState(scene: Scene, input: SceneState) {
  const restored = restoreSceneState(scene, input);
  if (fingerprint({ ...input, playing: false }) !== fingerprint(restored))
    throw new Error("Scene state contains unknown or out-of-bounds values");
  return restored;
}
export function applyBatch(
  scene: Scene,
  state: SceneState,
  actions: SceneAction[],
) {
  let candidate = structuredClone(state);
  for (const action of actions) {
    const result = transition(scene, candidate, action);
    if (!result.ok) throw new Error(result.feedback);
    candidate = result.state;
  }
  return candidate;
}
export function sceneSources(scene: Scene): TutorSource[] {
  if (scene.type === "task-scheduler")
    return [
      {
        id: "spark-components",
        title: "Apache Spark component definitions",
        kind: "framework",
        url: sparkSource,
      },
    ];
  if (scene.type === "supply-demand")
    return [
      {
        id: "supply-demand-framework",
        title: "OpenStax supply and demand",
        kind: "framework",
        url: economicSource,
      },
    ];
  if (scene.type === "dna-replication")
    return [
      {
        id: "dna-mechanisms",
        title: "DNA Replication Mechanisms",
        kind: "framework",
        url: dnaSource,
      },
    ];
  if (scene.type === "historical-timeline")
    return timelineEvents(scene).map((e) => ({
      id: e.id,
      title: `${e.date} · ${e.label}`,
      kind: "catalog" as const,
      url: e.source,
      quote: e.description,
    }));
  return [];
}
export function comparisonText(before: Metric[], after: Metric[]) {
  return before
    .map(
      (m, i) =>
        `${m.label}: ${m.value}${m.unit ? " " + m.unit : ""} → ${after[i]?.value ?? "Unavailable"}${after[i]?.unit ? " " + after[i].unit : ""}`,
    )
    .join("\n");
}
