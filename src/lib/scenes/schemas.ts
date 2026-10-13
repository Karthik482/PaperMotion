import { z } from "zod";
import { extendedSceneOptions } from "./extendedSchemas";
import { timelineSchema } from "../tutor/schemas";
import { validateTimeline } from "../tutor/timeline";
import { initialSceneState } from "./simulation";

const text = z.string().trim().min(1).max(1200);
const number = (min: number, max: number) =>
  z.number().finite().min(min).max(max);
const common = {
  title: text,
  description: text,
  assumptions: z.array(text).min(1).max(6),
};
const node = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,32}$/),
    label: z.string().min(1).max(80),
    description: text,
  })
  .strict();
export const baseSceneSchema = z.discriminatedUnion("type", [
  ...extendedSceneOptions,
  z
    .object({
      ...common,
      type: z.literal("function-plot"),
      config: z
        .object({
          function: z.enum(["quadratic", "sine", "exponential", "logistic"]),
          a: number(-10, 10),
          b: number(-10, 10),
          c: number(-10, 10),
          xMin: number(-10, 9),
          xMax: number(-9, 10),
          xLabel: text,
          yLabel: text,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal("gradient-descent"),
      config: z
        .object({
          a: number(0.1, 10),
          b: number(-10, 10),
          c: number(-10, 10),
          initialX: number(-10, 10),
          learningRate: number(0.001, 2),
          iterations: number(1, 60).int(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal("projectile-motion"),
      config: z
        .object({
          speed: number(1, 80),
          angle: number(0, 90),
          gravity: number(0.5, 20),
          height: number(0, 50),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal("harmonic-motion"),
      config: z
        .object({
          mass: number(0.1, 20),
          stiffness: number(0.1, 100),
          amplitude: number(0, 5),
          phase: number(0, 6.283185307179586),
          duration: number(1, 30),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal("probability"),
      config: z
        .object({
          trials: number(1, 30).int(),
          probability: number(0, 1),
          successLabel: text,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal("vector-transform"),
      config: z
        .object({
          matrix: z
            .object({
              m11: number(-5, 5),
              m12: number(-5, 5),
              m21: number(-5, 5),
              m22: number(-5, 5),
            })
            .strict(),
          x: number(-5, 5),
          y: number(-5, 5),
          angle: number(-180, 180),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal("process-diagram"),
      config: z.object({ nodes: z.array(node).min(2).max(12) }).strict(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal("concept-map"),
      config: z
        .object({
          nodes: z.array(node).min(2).max(12),
          edges: z
            .array(
              z
                .object({
                  from: z.string().min(1).max(32),
                  to: z.string().min(1).max(32),
                  label: z.string().min(1).max(100),
                })
                .strict(),
            )
            .min(1)
            .max(20),
        })
        .strict(),
    })
    .strict(),
]);
const animatedOptions = baseSceneSchema.options.map((option) =>
  option.extend({ watch: timelineSchema.nullable().optional() }),
);
export const sceneSchema = z.discriminatedUnion("type", [
  animatedOptions[0],
  ...animatedOptions.slice(1),
]);
export type Scene = z.infer<typeof sceneSchema>;
export function validateScene(input: unknown): Scene {
  if (JSON.stringify(input)?.length > 32000)
    throw new Error("Scene exceeds size limit");
  const scene = sceneSchema.parse(input);
  if (scene.watch)
    validateTimeline(scene, initialSceneState(scene), scene.watch);
  if (
    scene.type === "historical-timeline" &&
    new Set(scene.config.eventIds).size !== scene.config.eventIds.length
  )
    throw new Error("Duplicate historical event");
  if (scene.type === "data-explorer") {
    if (
      new Set(scene.config.rows.map((r) => r.id)).size !==
        scene.config.rows.length ||
      new Set(scene.config.lookup.map((r) => r.id)).size !==
        scene.config.lookup.length
    )
      throw new Error("Duplicate data row");
  }
  if (
    scene.type === "spatial-explorer" ||
    scene.type === "annotated-illustration"
  ) {
    const entries =
      scene.type === "spatial-explorer"
        ? scene.config.points
        : scene.config.regions;
    const ids = new Set(entries.map((e) => e.id));
    if (ids.size !== entries.length)
      throw new Error("Duplicate visual element");
    if (scene.type === "annotated-illustration") {
      for (const frame of scene.config.frames)
        if (
          new Set(frame.visibleIds).size !== frame.visibleIds.length ||
          frame.visibleIds.some((id) => !ids.has(id))
        )
          throw new Error("Unknown illustration region");
      for (const region of scene.config.regions)
        if (
          region.x - region.width / 2 < 0 ||
          region.x + region.width / 2 > 100 ||
          region.y - region.height / 2 < 0 ||
          region.y + region.height / 2 > 100
        )
          throw new Error("Illustration region outside canvas");
    }
  }
  if (scene.type === "function-plot" && scene.config.xMin >= scene.config.xMax)
    throw new Error("Function domain must increase");
  if (scene.type === "process-diagram" || scene.type === "concept-map") {
    const ids = new Set(scene.config.nodes.map((n) => n.id));
    if (ids.size !== scene.config.nodes.length)
      throw new Error("Duplicate scene node ID");
    if (scene.type === "concept-map") {
      if (
        scene.config.edges.some(
          (e) => !ids.has(e.from) || !ids.has(e.to) || e.from === e.to,
        )
      )
        throw new Error("Invalid concept edge");
      if (
        new Set(scene.config.edges.map((e) => `${e.from}:${e.to}`)).size !==
        scene.config.edges.length
      )
        throw new Error("Duplicate concept edge");
      if (
        scene.config.nodes.some(
          (n) =>
            !scene.config.edges.some((e) => e.from === n.id || e.to === n.id),
        )
      )
        throw new Error("Disconnected concept");
    }
  }
  return scene;
}

export const sceneCapabilities = {
  "task-scheduler":
    "Simplified Spark-style execution: partitions become one task per stage, driver schedules equal-duration tasks over executors×slots, stage barriers, no shuffle overhead or failures. Vary partitions, executor count, slots, task duration; step through waves. Distinguish DataFrame/RDD programming abstractions from driver/cluster manager/executor runtime actors.",
  "supply-demand":
    "Illustrative linear inverse curves P_d=a-bQ+shiftD and P_s=c+dQ+shiftS. Vary intercepts, slopes and shifts. Solve nonnegative equilibrium or report no feasible intersection. Compare configured baseline. Not economic forecasting.",
  "dna-replication":
    "Authored five-stage local DNA fork mechanism: parent, separation, primers, 5′→3′ extension with leading/lagging strands, primer replacement and ligation. Select bases, toggle enzyme layer; fixed trusted biology, not molecular dynamics. ACGT sequence 6–16 bases.",
  "historical-timeline":
    "Source-backed Apollo chronology ONLY. Pick audited eventIds; dates, descriptions and NASA evidence are supplied by the engine. Select events, compare Earth-orbit/lunar tracks and elapsed days. No arbitrary history citations or unsupported causal claims.",
  "data-explorer":
    "Bounded editable numerical rows. Exact filter value>=threshold, key-based SQL LEFT JOIN including multiple matches/nulls, or bubble-sort adjacent-comparison trace. Select rows, change threshold/value, step through intermediate output. No executable SQL or arbitrary programs.",
  "spatial-explorer":
    "Select points on an illustrative Cartesian coordinate plane, compare Euclidean distances, zoom/pan/fit. Coordinates -100..100, supplied units. NOT a geographical map, anatomical measurement or historical border reconstruction.",
  "annotated-illustration":
    "Trusted rectangles/ellipses with bounded normalized positions, labels, inspectable regions, visible layers and authored frames. Useful schematic fallback for biology, engineering or humanities; NEVER imply scientifically accurate anatomy or geographic boundaries.",
  "function-plot":
    "Select x and vary a, b, c. Only quadratic a*x²+b*x+c, a*sin(b*x)+c, a*exp(b*x)+c, or a/(1+exp(-b*x))+c. Display configured axis labels. No arbitrary expressions.",
  "gradient-descent":
    "Convex quadratic f(x)=a*x²+b*x+c; a>0. Exact gradient 2*a*x+b. Change learning rate, initial x, and iteration. Display divergence when bounded numerical limits are reached. No neural-network training.",
  "projectile-motion":
    "Ideal 2D launch from height, constant gravity, no drag. SI units; vary speed, angle, gravity and height; step through time.",
  "harmonic-motion":
    "Undamped ideal mass-spring oscillator x=A*cos(sqrt(k/m)*t+phase), SI units. Vary mass, stiffness and amplitude; step through time.",
  probability:
    "Exact binomial distribution for n independent trials with common p. Change n and p, select number of successes. Not a Monte Carlo sample or general distribution.",
  "vector-transform":
    "A real 2x2 matrix followed by a planar rotation applied to a 2D vector. Vary vector and angle. No 3D transformation.",
  "process-diagram":
    "Ordered labeled stages, each with an explanation; select stages, step through, replay. A conceptual diagram, not a quantitative simulation. Suitable for SQL, CPU, biology, humanities or any ordered process.",
  "concept-map":
    "Labeled concept nodes and directed, labeled relationships. Select a node to inspect its explanation and connections. Conceptual fallback for topics without a supported simulation; never claim computed physical behavior.",
} as const;
