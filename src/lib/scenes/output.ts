import type { Scene } from "./schemas";
import {
  binomial,
  evaluateFunction,
  gradientDescent,
  oscillator,
  projectile,
  transformVector,
  type Point,
  type SceneState,
  initialSceneState,
  sceneControls,
} from "./simulation";
export function computedExample(scene: Scene): string | null {
  const state = initialSceneState(scene);
  const output = sceneOutput(scene, state);
  if (!output) return null;
  const number = (value: number) =>
    Math.abs(value) >= 1e6 || (Math.abs(value) > 0 && Math.abs(value) < 0.0001)
      ? value.toExponential(6)
      : Number(value.toFixed(8)).toString();
  const inputs = Object.entries(state.parameters)
    .map(([key, value]) => {
      const control = sceneControls(scene).find((item) => item.key === key);
      return `${control?.label || key} = ${number(value)}${control?.unit ? ` ${control.unit}` : ""}`;
    })
    .join(", ");
  const results = output.metrics
    .map(
      (metric) =>
        `${metric.label} = ${number(metric.value)}${metric.unit ? ` ${metric.unit}` : ""}`,
    )
    .join("; ");
  return `Computed from this scene’s starting settings (${inputs}; step ${state.step}). ${results}.${output.warning ? ` ${output.warning}` : ""} Adjust the controls above to compare other settings.`;
}
export type SceneOutput = {
  points: Point[];
  trail?: Point[];
  marker: Point;
  metrics: { label: string; value: number; unit?: string }[];
  formula: string;
  xLabel: string;
  yLabel: string;
  warning?: string;
  bars?: boolean;
};
export function sceneOutput(
  scene: Scene,
  state: SceneState,
): SceneOutput | null {
  const p = state.parameters;
  const sample = (
    min: number,
    max: number,
    fn: (x: number) => number,
    segments = 120,
  ) =>
    Array.from({ length: segments + 1 }, (_, i) => {
      const x = min + ((max - min) * i) / segments;
      return { x, y: fn(x) };
    });
  switch (scene.type) {
    case "function-plot": {
      const c = scene.config,
        fn = (x: number) => evaluateFunction(c.function, x, p.a, p.b, p.c);
      return {
        points: sample(
          c.xMin,
          c.xMax,
          fn,
          c.function === "sine"
            ? Math.max(
                120,
                Math.ceil(
                  ((Math.abs(p.b) * (c.xMax - c.xMin)) / (2 * Math.PI)) * 24,
                ),
              )
            : 120,
        ),
        marker: { x: p.x, y: fn(p.x) },
        metrics: [
          { label: c.xLabel, value: p.x },
          { label: c.yLabel, value: fn(p.x) },
        ],
        formula: {
          quadratic: "a·x² + b·x + c",
          sine: "a·sin(b·x) + c",
          exponential: "a·exp(b·x) + c",
          logistic: "a / (1 + exp(−b·x)) + c",
        }[c.function],
        xLabel: c.xLabel,
        yLabel: c.yLabel,
      };
    }
    case "gradient-descent": {
      const c = scene.config,
        result = gradientDescent(
          c.a,
          c.b,
          c.c,
          p.initialX,
          p.learningRate,
          state.step,
        ),
        min = -c.b / (2 * c.a),
        span = Math.max(3, Math.abs(p.initialX - min) * 1.3),
        fn = (x: number) => c.a * x * x + c.b * x + c.c;
      return {
        points: sample(min - span, min + span, fn),
        trail: result.points,
        marker: { x: result.x, y: result.loss },
        metrics: [
          { label: "Iterations", value: result.iterations },
          { label: "Current x", value: result.x },
          { label: "Final loss", value: result.loss },
        ],
        formula: `f(x) = ${c.a}·x² + ${c.b}·x + ${c.c}; x ← x − η(2·a·x + b)`,
        xLabel: "x",
        yLabel: "f(x)",
        warning: result.diverged
          ? "Diverged: the next update exceeds the numerical display limit. Lower the learning rate."
          : undefined,
      };
    }
    case "projectile-motion": {
      const c = scene.config,
        end = projectile(p.speed, p.angle, p.gravity, p.height, 0),
        t = (end.flightTime * state.step) / 100,
        at = projectile(p.speed, p.angle, p.gravity, p.height, t);
      return {
        points: sample(
          0,
          end.flightTime,
          (time) => projectile(p.speed, p.angle, p.gravity, p.height, time).y,
        ).map((pt) => ({
          x: projectile(p.speed, p.angle, p.gravity, p.height, pt.x).x,
          y: pt.y,
        })),
        marker: { x: at.x, y: at.y },
        metrics: [
          { label: "Time", value: t, unit: "s" },
          { label: "Horizontal position", value: at.x, unit: "m" },
          { label: "Height", value: at.y, unit: "m" },
          { label: "Range", value: end.range, unit: "m" },
        ],
        formula: "x = v·cos(θ)·t; y = h + v·sin(θ)·t − ½g·t²",
        xLabel: "Distance (m)",
        yLabel: "Height (m)",
      };
    }
    case "harmonic-motion": {
      const c = scene.config,
        t = (c.duration * state.step) / 100,
        at = oscillator(p.mass, p.stiffness, p.amplitude, c.phase, t);
      return {
        points: sample(
          0,
          c.duration,
          (time) =>
            oscillator(p.mass, p.stiffness, p.amplitude, c.phase, time).x,
          Math.max(
            120,
            Math.ceil(
              ((c.duration * Math.sqrt(p.stiffness / p.mass)) / (2 * Math.PI)) *
                24,
            ),
          ),
        ),
        marker: { x: t, y: at.x },
        metrics: [
          { label: "Time", value: t, unit: "s" },
          { label: "Displacement", value: at.x, unit: "m" },
          { label: "Period", value: at.period, unit: "s" },
          { label: "Total energy", value: at.energy, unit: "J" },
        ],
        formula: "x(t) = A·cos(√(k/m)·t + φ)",
        xLabel: "Time (s)",
        yLabel: "Displacement (m)",
      };
    }
    case "probability": {
      const points = binomial(p.trials, p.probability),
        k = Math.min(state.step, p.trials);
      return {
        points,
        marker: points[k],
        metrics: [
          { label: "Selected successes", value: k },
          {
            label: "Selected probability",
            value: points[k].y * 100,
            unit: "%",
          },
          { label: "Expected successes", value: p.trials * p.probability },
          {
            label: "Total probability",
            value: points.reduce((sum, v) => sum + v.y, 0) * 100,
            unit: "%",
          },
        ],
        formula: "P(X = k) = C(n,k)·pᵏ·(1−p)ⁿ⁻ᵏ",
        xLabel: scene.config.successLabel,
        yLabel: "Probability",
        bars: true,
      };
    }
    case "vector-transform": {
      const c = scene.config,
        { m11, m12, m21, m22 } = c.matrix,
        at = transformVector([m11, m12, m21, m22], p.x, p.y, p.angle);
      return {
        points: [
          { x: 0, y: 0 },
          { x: p.x, y: p.y },
        ],
        trail: [{ x: 0, y: 0 }, at],
        marker: at,
        metrics: [
          { label: "Transformed x", value: at.x },
          { label: "Transformed y", value: at.y },
          { label: "Matrix determinant", value: m11 * m22 - m12 * m21 },
        ],
        formula: `R(θ) · [[${m11}, ${m12}], [${m21}, ${m22}]] · [x, y]`,
        xLabel: "x",
        yLabel: "y",
      };
    }
    default:
      return null;
  }
}
