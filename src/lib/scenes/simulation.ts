import type { Scene } from "./schemas";
import { timelineEvents, schedule } from "./models";

export type SceneState = {
  parameters: Record<string, number>;
  step: number;
  selected: string | null;
  layers?: Record<string, boolean>;
  comparison?: boolean;
  view?: { zoom: number; x: number; y: number };
  speed?: number;
  playing?: boolean;
};
export type Control = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
};
export type Point = { x: number; y: number };
export const sceneControls = (scene: Scene): Control[] => {
  switch (scene.type) {
    case "task-scheduler":
      return [
        {
          key: "partitions",
          label: "Dataset partitions",
          min: 1,
          max: 24,
          step: 1,
        },
        {
          key: "executors",
          label: "Executor processes",
          min: 1,
          max: 6,
          step: 1,
        },
        { key: "slots", label: "Slots per executor", min: 1, max: 4, step: 1 },
        {
          key: "taskDuration",
          label: "Equal task duration",
          min: 1,
          max: 8,
          step: 1,
          unit: "s",
        },
      ];
    case "supply-demand":
      return [
        {
          key: "demandIntercept",
          label: "Demand intercept",
          min: 20,
          max: 200,
          step: 1,
        },
        {
          key: "demandSlope",
          label: "Demand slope",
          min: 0.1,
          max: 5,
          step: 0.1,
        },
        {
          key: "supplyIntercept",
          label: "Supply intercept",
          min: 0,
          max: 100,
          step: 1,
        },
        {
          key: "supplySlope",
          label: "Supply slope",
          min: 0.1,
          max: 5,
          step: 0.1,
        },
        {
          key: "demandShift",
          label: "Demand shift",
          min: -50,
          max: 50,
          step: 1,
        },
        {
          key: "supplyShift",
          label: "Supply shift",
          min: -50,
          max: 50,
          step: 1,
        },
      ];
    case "data-explorer":
      return [
        {
          key: "threshold",
          label: "Filter threshold",
          min: -10000,
          max: 10000,
          step: 1,
        },
        ...scene.config.rows.map((r) => ({
          key: `row-${r.id}`,
          label: `Value: ${r.key}`,
          min: -10000,
          max: 10000,
          step: 1,
        })),
      ].filter(
        (c) => c.key !== "threshold" || scene.config.operation === "filter",
      );
    case "function-plot":
      return [
        { key: "a", label: "Coefficient a", min: -10, max: 10, step: 0.1 },
        { key: "b", label: "Coefficient b", min: -10, max: 10, step: 0.1 },
        { key: "c", label: "Offset c", min: -10, max: 10, step: 0.1 },
        {
          key: "x",
          label: scene.config.xLabel,
          min: scene.config.xMin,
          max: scene.config.xMax,
          step: 0.01,
        },
      ];
    case "gradient-descent":
      return [
        {
          key: "learningRate",
          label: "Learning rate",
          min: 0.001,
          max: 2,
          step: 0.001,
        },
        { key: "initialX", label: "Initial x", min: -10, max: 10, step: 0.1 },
      ];
    case "projectile-motion":
      return [
        {
          key: "speed",
          label: "Launch speed",
          min: 1,
          max: 80,
          step: 1,
          unit: "m/s",
        },
        {
          key: "angle",
          label: "Launch angle",
          min: 0,
          max: 90,
          step: 1,
          unit: "°",
        },
        {
          key: "gravity",
          label: "Gravity",
          min: 0.5,
          max: 20,
          step: 0.1,
          unit: "m/s²",
        },
        {
          key: "height",
          label: "Launch height",
          min: 0,
          max: 50,
          step: 1,
          unit: "m",
        },
      ];
    case "harmonic-motion":
      return [
        {
          key: "mass",
          label: "Mass",
          min: 0.1,
          max: 20,
          step: 0.1,
          unit: "kg",
        },
        {
          key: "stiffness",
          label: "Spring stiffness",
          min: 0.1,
          max: 100,
          step: 0.1,
          unit: "N/m",
        },
        {
          key: "amplitude",
          label: "Amplitude",
          min: 0,
          max: 5,
          step: 0.1,
          unit: "m",
        },
      ];
    case "probability":
      return [
        {
          key: "trials",
          label: "Independent trials",
          min: 1,
          max: 30,
          step: 1,
        },
        {
          key: "probability",
          label: "Success probability",
          min: 0,
          max: 1,
          step: 0.01,
        },
      ];
    case "vector-transform":
      return [
        { key: "x", label: "Vector x", min: -5, max: 5, step: 0.1 },
        { key: "y", label: "Vector y", min: -5, max: 5, step: 0.1 },
        {
          key: "angle",
          label: "Rotation",
          min: -180,
          max: 180,
          step: 1,
          unit: "°",
        },
      ];
    default:
      return [];
  }
};
export function initialSceneState(scene: Scene): SceneState {
  const parameters: Record<string, number> = {};
  for (const control of sceneControls(scene))
    parameters[control.key] =
      control.key.startsWith("row-") && scene.type === "data-explorer"
        ? scene.config.rows.find((r) => `row-${r.id}` === control.key)!.value
        : control.key === "x" && scene.type === "function-plot"
          ? (scene.config.xMin + scene.config.xMax) / 2
          : Number(
              (scene.config as unknown as Record<string, unknown>)[control.key],
            );
  return {
    parameters,
    step: scene.type === "gradient-descent" ? scene.config.iterations : 0,
    selected:
      scene.type === "historical-timeline"
        ? timelineEvents(scene)[0].id
        : scene.type === "spatial-explorer"
          ? scene.config.points[0].id
          : scene.type === "annotated-illustration"
            ? scene.config.frames[0].visibleIds[0]
            : scene.type === "concept-map" || scene.type === "process-diagram"
              ? scene.config.nodes[0].id
              : null,
    layers:
      scene.type === "dna-replication"
        ? { enzymes: scene.config.showEnzymes }
        : scene.type === "annotated-illustration"
          ? Object.fromEntries(scene.config.regions.map((r) => [r.layer, true]))
          : {},
    comparison:
      scene.type === "historical-timeline" ? scene.config.comparison : false,
    view: { zoom: 1, x: 0, y: 0 },
    speed: 1,
    playing: false,
  };
}
export function maxSceneStep(scene: Scene, state: SceneState) {
  switch (scene.type) {
    case "task-scheduler":
      return schedule(
        state.parameters.partitions,
        state.parameters.executors,
        state.parameters.slots,
        state.parameters.taskDuration,
        scene.config.stages,
        0,
        scene.config.records,
      ).max;
    case "dna-replication":
      return 4;
    case "historical-timeline":
      return scene.config.eventIds.length - 1;
    case "data-explorer":
      return scene.config.operation === "bubble-sort"
        ? (scene.config.rows.length * (scene.config.rows.length - 1)) / 2
        : scene.config.rows.length;
    case "annotated-illustration":
      return scene.config.frames.length - 1;
    case "gradient-descent":
      return 60;
    case "projectile-motion":
    case "harmonic-motion":
      return 100;
    case "probability":
      return state.parameters.trials;
    case "process-diagram":
      return scene.config.nodes.length - 1;
    default:
      return 0;
  }
}
export function restoreSceneState(scene: Scene, input: unknown): SceneState {
  const state = initialSceneState(scene);
  if (!input || typeof input !== "object") return state;
  const value = input as Partial<SceneState>;
  for (const c of sceneControls(scene)) {
    const n = value.parameters?.[c.key];
    if (
      typeof n === "number" &&
      Number.isFinite(n) &&
      n >= c.min &&
      n <= c.max &&
      (c.step !== 1 || Number.isInteger(n))
    )
      state.parameters[c.key] = n;
  }
  if (
    Number.isInteger(value.step) &&
    value.step! >= 0 &&
    value.step! <= maxSceneStep(scene, state)
  )
    state.step = value.step!;
  if (
    (scene.type === "concept-map" || scene.type === "process-diagram") &&
    scene.config.nodes.some((n) => n.id === value.selected)
  )
    state.selected = value.selected!;
  const ids =
    scene.type === "historical-timeline"
      ? scene.config.eventIds
      : scene.type === "spatial-explorer"
        ? scene.config.points.map((p) => p.id)
        : scene.type === "annotated-illustration"
          ? scene.config.regions.map((p) => p.id)
          : scene.type === "dna-replication"
            ? Array.from(
                { length: scene.config.sequence.length },
                (_, i) => `base-${i}`,
              )
            : scene.type === "data-explorer"
              ? scene.config.rows.map((r) => r.id)
              : scene.type === "task-scheduler"
                ? Array.from(
                    { length: state.parameters.partitions },
                    (_, i) => `task-${i}`,
                  )
                : [];
  if (ids.some((id) => id === value.selected)) state.selected = value.selected!;
  for (const id of Object.keys(state.layers || {}))
    if (typeof value.layers?.[id] === "boolean")
      state.layers![id] = value.layers[id];
  if (typeof value.comparison === "boolean")
    state.comparison = value.comparison;
  if (
    value.view &&
    [value.view.zoom, value.view.x, value.view.y].every(Number.isFinite) &&
    value.view.zoom >= 1 &&
    value.view.zoom <= 3 &&
    Math.abs(value.view.x) <= 960 &&
    Math.abs(value.view.y) <= 960
  )
    state.view = { zoom: value.view.zoom, x: value.view.x, y: value.view.y };
  if ([0.5, 1, 2].includes(value.speed!)) state.speed = value.speed;
  return state;
}
export function evaluateFunction(
  kind: "quadratic" | "sine" | "exponential" | "logistic",
  x: number,
  a: number,
  b: number,
  c: number,
) {
  switch (kind) {
    case "quadratic":
      return a * x * x + b * x + c;
    case "sine":
      return a * Math.sin(b * x) + c;
    case "exponential":
      return a * Math.exp(b * x) + c;
    case "logistic":
      return a / (1 + Math.exp(-b * x)) + c;
  }
}
export function gradientDescent(
  a: number,
  b: number,
  c: number,
  initialX: number,
  rate: number,
  iterations: number,
) {
  if (
    ![a, b, c, initialX, rate].every(Number.isFinite) ||
    a <= 0 ||
    rate <= 0 ||
    !Number.isInteger(iterations) ||
    iterations < 0 ||
    iterations > 60
  )
    throw new Error("Invalid gradient descent parameters");
  const points: Point[] = [
    { x: initialX, y: a * initialX * initialX + b * initialX + c },
  ];
  let x = initialX,
    diverged = false;
  for (let i = 0; i < iterations; i++) {
    const next = x - rate * (2 * a * x + b);
    if (!Number.isFinite(next) || Math.abs(next) > 1e6) {
      diverged = true;
      break;
    }
    x = next;
    points.push({ x, y: a * x * x + b * x + c });
  }
  return {
    points,
    x,
    loss: a * x * x + b * x + c,
    diverged,
    iterations: points.length - 1,
  };
}
export function projectile(
  speed: number,
  angle: number,
  gravity: number,
  height: number,
  time: number,
) {
  if (
    ![speed, angle, gravity, height, time].every(Number.isFinite) ||
    speed <= 0 ||
    gravity <= 0 ||
    height < 0 ||
    time < 0
  )
    throw new Error("Invalid projectile parameters");
  const radians = (angle * Math.PI) / 180,
    vx = speed * Math.cos(radians),
    vy = speed * Math.sin(radians),
    flightTime = (vy + Math.sqrt(vy * vy + 2 * gravity * height)) / gravity,
    t = Math.min(time, flightTime);
  return {
    x: vx * t,
    y: Math.max(0, height + vy * t - 0.5 * gravity * t * t),
    flightTime,
    range: vx * flightTime,
    peak: height + (vy * vy) / (2 * gravity),
    time: t,
  };
}
export function oscillator(
  mass: number,
  stiffness: number,
  amplitude: number,
  phase: number,
  time: number,
) {
  if (
    ![mass, stiffness, amplitude, phase, time].every(Number.isFinite) ||
    mass <= 0 ||
    stiffness <= 0 ||
    amplitude < 0
  )
    throw new Error("Invalid oscillator parameters");
  const omega = Math.sqrt(stiffness / mass);
  return {
    x: amplitude * Math.cos(omega * time + phase),
    velocity: -amplitude * omega * Math.sin(omega * time + phase),
    period: (2 * Math.PI) / omega,
    energy: 0.5 * stiffness * amplitude * amplitude,
  };
}
export function binomial(n: number, p: number) {
  if (
    !Number.isInteger(n) ||
    n < 1 ||
    n > 30 ||
    !Number.isFinite(p) ||
    p < 0 ||
    p > 1
  )
    throw new Error("Invalid binomial parameters");
  let choose = 1;
  return Array.from({ length: n + 1 }, (_, k) => {
    if (k > 0) choose = (choose * (n - k + 1)) / k;
    return { x: k, y: choose * Math.pow(p, k) * Math.pow(1 - p, n - k) };
  });
}
export function transformVector(
  matrix: readonly number[],
  x: number,
  y: number,
  angle: number,
) {
  if (matrix.length !== 4 || ![...matrix, x, y, angle].every(Number.isFinite))
    throw new Error("Invalid transformation");
  const u = matrix[0] * x + matrix[1] * y,
    v = matrix[2] * x + matrix[3] * y,
    r = (angle * Math.PI) / 180;
  return {
    x: u * Math.cos(r) - v * Math.sin(r),
    y: u * Math.sin(r) + v * Math.cos(r),
  };
}
