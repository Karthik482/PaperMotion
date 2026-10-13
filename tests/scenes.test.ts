import { test } from "node:test";
import assert from "node:assert/strict";
import { zodTextFormat } from "openai/helpers/zod";
import { validateScene } from "../src/lib/scenes/schemas";
import {
  interactivePlanSchema,
  validateInteractivePlan,
} from "../src/lib/topics/schemas";
import {
  binomial,
  gradientDescent,
  projectile,
  oscillator,
  transformVector,
  evaluateFunction,
  initialSceneState,
  restoreSceneState,
} from "../src/lib/scenes/simulation";
import { sceneOutput, computedExample } from "../src/lib/scenes/output";
import { topicId } from "../src/lib/topics/storage";
import { sceneFixtures, interactiveFixture } from "./helpers/sceneFixture";

test("worked examples use computed values and high-frequency curves retain oscillations", () => {
  assert.match(computedExample(sceneFixtures[0])!, /Final loss = 0\.09674588/);
  const plan = interactiveFixture();
  plan.steps[0].experience.scene = sceneFixtures[0];
  plan.steps[0].example = "Incorrect AI arithmetic: loss = 999";
  assert.match(
    validateInteractivePlan(plan, "CPU").steps[0].example,
    /Final loss = 0\.09674588/,
  );
  const scene = validateScene({
    ...sceneFixtures[3],
    config: { mass: 0.1, stiffness: 100, amplitude: 2, phase: 0, duration: 30 },
  });
  const output = sceneOutput(scene, initialSceneState(scene))!;
  const crossings = output.points
    .slice(1)
    .filter((p, i) => p.y * output.points[i].y < 0).length;
  assert.ok(Math.abs(crossings - (30 * Math.sqrt(100 / 0.1)) / Math.PI) <= 1);
});

test("gradient descent agrees with independent analytic solution and handles divergence", () => {
  const result = gradientDescent(1, 0, 0, 4, 0.2, 5);
  assert.ok(Math.abs(result.loss - 0.0967458816) < 1e-12);
  assert.ok(Math.abs(result.x - 4 * Math.pow(0.6, 5)) < 1e-12);
  const general = gradientDescent(2, -4, 7, 3, 0.1, 10),
    optimum = 1;
  assert.ok(
    Math.abs(general.x - (optimum + (3 - optimum) * Math.pow(0.6, 10))) < 1e-12,
  );
  assert.equal(gradientDescent(10, 0, 0, 4, 2, 60).diverged, true);
  assert.equal(gradientDescent(1, 0, 0, 4, 0.2, 0).loss, 16);
  assert.throws(() => gradientDescent(0, 0, 0, 1, 0.2, 5));
  assert.throws(() => gradientDescent(1, 0, 0, 1, 0.2, 100000));
});
test("projectile follows analytic range and ground boundary", () => {
  const result = projectile(20, 45, 10, 0, 100);
  assert.ok(Math.abs(result.range - 40) < 1e-10);
  assert.equal(result.y, 0);
  assert.ok(Math.abs(result.flightTime - 2 * Math.sqrt(2)) < 1e-10);
  assert.equal(projectile(10, 0, 10, 5, 0).y, 5);
  assert.throws(() => projectile(20, 45, 0, 0, 1));
});
test("oscillator conserves energy and matches quarter-period displacement", () => {
  const initial = oscillator(2, 8, 3, 0, 0),
    quarter = oscillator(2, 8, 3, 0, initial.period / 4);
  assert.ok(Math.abs(quarter.x) < 1e-12);
  assert.equal(initial.energy, 36);
  assert.ok(
    Math.abs(
      0.5 * 2 * quarter.velocity ** 2 +
        0.5 * 8 * quarter.x ** 2 -
        initial.energy,
    ) < 1e-10,
  );
  assert.throws(() => oscillator(-1, 8, 3, 0, 0));
});
test("binomial normalizes at boundaries and across supported sizes", () => {
  for (const n of [1, 10, 30])
    for (const p of [0, 0.01, 0.5, 0.99, 1]) {
      const distribution = binomial(n, p);
      assert.ok(
        Math.abs(distribution.reduce((s, v) => s + v.y, 0) - 1) < 1e-12,
      );
      assert.ok(distribution.every((v) => v.y >= 0));
    }
  assert.equal(binomial(10, 0)[0].y, 1);
  assert.equal(binomial(10, 1)[10].y, 1);
  assert.throws(() => binomial(31, 0.5));
});
test("vector matrix then rotation and allowed functions produce actual results", () => {
  const result = transformVector([2, 0, 0, 1], 1, 2, 90);
  assert.ok(Math.abs(result.x + 2) < 1e-12);
  assert.ok(Math.abs(result.y - 2) < 1e-12);
  assert.equal(evaluateFunction("quadratic", 3, 2, -1, 4), 19);
  assert.equal(evaluateFunction("logistic", 0, 1, 1, 0), 0.5);
  assert.ok(
    Math.abs(evaluateFunction("sine", Math.PI / 2, 1, 1, 0) - 1) < 1e-12,
  );
  assert.equal(evaluateFunction("exponential", 0, 2, 1, 3), 5);
});
test("all scene types validate, calculate finite output and restore only bounded state", () => {
  for (const fixture of sceneFixtures) {
    const scene = validateScene(fixture),
      state = initialSceneState(scene),
      output = sceneOutput(scene, state);
    if (output) {
      assert.ok(output.metrics.every((m) => Number.isFinite(m.value)));
      assert.ok(
        output.points.every(
          (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
        ),
      );
    }
    const restored = restoreSceneState(scene, {
      parameters: { learningRate: Infinity, probability: 4, trials: 100000 },
      step: 999999,
      selected: "invented",
    });
    assert.deepEqual(restored, state);
  }
  assert.equal(
    restoreSceneState(sceneFixtures[0], {
      parameters: { learningRate: 0.3 },
      step: 12,
    }).step,
    12,
  );
});
test("scene validation rejects invented types, code properties, bad domains and graph references", () => {
  assert.throws(() =>
    validateScene({ ...sceneFixtures[0], type: "run-javascript" }),
  );
  assert.throws(() =>
    validateScene({ ...sceneFixtures[0], code: "fetch(secret)" }),
  );
  const graph = structuredClone(sceneFixtures[7]);
  if (graph.type === "concept-map") {
    graph.config.edges[0].to = "fabricated";
    assert.throws(() => validateScene(graph));
    graph.config.edges[0].to = "claim";
    graph.config.nodes[1].id = "claim";
    assert.throws(() => validateScene(graph));
  }
  const fn = structuredClone(sceneFixtures[1]);
  if (fn.type === "function-plot") {
    fn.config.xMin = 5;
    fn.config.xMax = -5;
    assert.throws(() => validateScene(fn));
  }
  const plan = interactiveFixture();
  assert.ok(validateInteractivePlan(plan, "CPU"));
  delete plan.steps[0].experience.scene;
  assert.throws(() => validateInteractivePlan(plan, "CPU"));
});
test("interactive cache keys separate levels and engine versions; SDK emits nested scene alternatives", () => {
  assert.notEqual(
    topicId("CPU", "beginner", 2),
    topicId("CPU", "technical", 2),
  );
  assert.notEqual(topicId("CPU", "beginner", 1), topicId("CPU", "beginner", 2));
  const format = zodTextFormat(interactivePlanSchema, "lesson");
  assert.equal(format.strict, true);
  assert.ok(JSON.stringify(format.schema).includes("gradient-descent"));
});
