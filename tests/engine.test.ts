import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { zodTextFormat } from "openai/helpers/zod";
import { sceneRegistry } from "../src/components/scenes/SceneRegistry";
import {
  referenceLessons,
  referenceLesson,
} from "../src/lib/topics/references";
import {
  validateUniversalPlan,
  universalPlanSchema,
} from "../src/lib/topics/schemas";
import { validateScene, type Scene } from "../src/lib/scenes/schemas";
import {
  schedule,
  equilibrium,
  dataTrace,
  dnaState,
  spatialDistance,
  timelineEvents,
} from "../src/lib/scenes/models";
import { transition } from "../src/lib/scenes/actions";
import {
  initialSceneState,
  maxSceneStep,
  restoreSceneState,
} from "../src/lib/scenes/simulation";
import { sceneFixtures } from "./helpers/sceneFixture";
const pick = <T extends Scene["type"]>(type: T) =>
  referenceLessons
    .flatMap((r) => r.plan.steps.map((s) => s.experience.scene))
    .find((s) => s?.type === type) as Extract<Scene, { type: T }>;
const act = (
  type: string,
  payload: Record<string, unknown> = {},
  target = "scene",
) => ({ version: 1, type, target, payload });
test("all five references use validated universal plans and registered renderers", () => {
  assert.equal(referenceLessons.length, 5);
  assert.equal(
    new Set(referenceLessons.map((r) => r.plan.steps[0].experience.scene?.type))
      .size,
    5,
  );
  for (const r of referenceLessons) {
    assert.deepEqual(validateUniversalPlan(r.plan, r.topic), r.plan);
    assert.deepEqual(referenceLesson(r.id), r);
    for (const step of r.plan.steps) {
      const s = validateScene(step.experience.scene);
      assert.ok(sceneRegistry[s.type]);
      const html = renderToStaticMarkup(
        createElement(sceneRegistry[s.type], {
          scene: s,
          state: initialSceneState(s),
          onSelect: () => {},
        }),
      );
      assert.ok(html.length > 300);
    }
  }
  assert.ok(zodTextFormat(universalPlanSchema, "universal").schema);
  const bad = structuredClone(referenceLessons[0].plan);
  bad.steps[0].experience.intent!.fidelity = "source-backed";
  assert.throws(
    () => validateUniversalPlan(bad, "Gradient descent"),
    /fidelity/,
  );
});
test("scheduler conserves records, respects slots and stage barriers, and recomputes duration", () => {
  const first = schedule(8, 2, 1, 2, 2, 1, 24);
  assert.equal(first.capacity, 2);
  assert.equal(first.tasks.filter((t) => t.status === "running").length, 2);
  assert.equal(first.estimatedTime, 16);
  assert.deepEqual(
    first.tasks.flatMap((t) => t.records).sort((a, b) => a - b),
    Array.from({ length: 24 }, (_, i) => i + 1),
  );
  const barrier = schedule(8, 2, 1, 2, 2, 8, 24);
  assert.equal(barrier.stage, 1);
  assert.equal(barrier.completed, 8);
  assert.ok(barrier.tasks.every((t) => t.status === "queued"));
  const faster = schedule(8, 4, 1, 2, 2, 8, 24);
  assert.equal(faster.estimatedTime, 8);
  assert.equal(faster.result, 300);
  assert.equal(faster.completed, faster.total);
  assert.equal(schedule(3, 2, 1, 2, 2, 8, 24).result, 300);
  assert.throws(() => schedule(8, 0, 1, 2, 2, 0, 24));
});
test("economic intersections match both equations and shifts have the correct direction", () => {
  const base = equilibrium(100, 1, 20, 1);
  assert.equal(base.quantity, 40);
  assert.equal(base.price, 60);
  const demand = equilibrium(100, 1, 20, 1, 20);
  assert.equal(demand.quantity, 50);
  assert.equal(demand.price, 70);
  const contraction = equilibrium(100, 1, 20, 1, 0, 20);
  assert.equal(contraction.quantity, 30);
  assert.equal(contraction.price, 70);
  for (const m of [
    base,
    demand,
    contraction,
    equilibrium(115, 1.7, 12, 0.4, -13, 7),
  ])
    assert.ok(Math.abs(m.demand(m.quantity) - m.supply(m.quantity)) < 1e-10);
  assert.equal(equilibrium(20, 1, 100, 1).feasible, false);
  assert.throws(() => equilibrium(100, 0, 20, 1));
});
const data = (
  operation: "filter" | "left-join" | "bubble-sort",
): Extract<Scene, { type: "data-explorer" }> => ({
  type: "data-explorer",
  title: "Exact rows",
  description: "Inspect a bounded operation",
  assumptions: ["Local integer rows only"],
  config: {
    operation,
    rows: [
      { id: "a", key: "A", value: 3 },
      { id: "b", key: "B", value: 1 },
      { id: "c", key: "C", value: 3 },
    ],
    lookup: [
      { id: "x", key: "A", label: "one" },
      { id: "y", key: "A", label: "two" },
    ],
    threshold: 2,
  },
});
test("data traces perform actual filtering, duplicate joins, NULLs and stable sorting", () => {
  const f = data("filter");
  assert.deepEqual(
    dataTrace(f, { ...initialSceneState(f), step: 3 }).output.map((r) => r.id),
    ["a", "c"],
  );
  const j = data("left-join"),
    joined = dataTrace(j, { ...initialSceneState(j), step: 3 });
  assert.equal(joined.output.length, 4);
  assert.deepEqual(
    joined.output.map((r) => r.joined),
    ["one", "two", null, null],
  );
  const s = data("bubble-sort"),
    end = dataTrace(s, { ...initialSceneState(s), step: 3 });
  assert.deepEqual(
    end.output.map((r) => r.id),
    ["b", "a", "c"],
  );
  assert.equal(
    dataTrace(s, { ...initialSceneState(s), step: 1 }).output[0].id,
    "b",
  );
  const changed = transition(
    s,
    { ...initialSceneState(s), step: 3 },
    act("set_parameter", { key: "row-a", value: 0 }),
  );
  assert.equal(changed.state.step, 0);
  assert.deepEqual(
    dataTrace(s, { ...changed.state, step: 3 }).output.map((r) => r.id),
    ["a", "b", "c"],
  );
});
test("DNA states change biological structures and timelines resolve only audited evidence", () => {
  assert.equal(dnaState("ACGTACGT", 0).complement, "TGCATGCA");
  assert.equal(dnaState("ACGTACGT", 1).opened, true);
  assert.equal(dnaState("ACGTACGT", 2).primed, true);
  assert.equal(dnaState("ACGTACGT", 3).extended, true);
  assert.equal(dnaState("ACGTACGT", 3).sealed, false);
  assert.equal(dnaState("ACGTACGT", 4).sealed, true);
  const events = timelineEvents(pick("historical-timeline"));
  assert.equal(events[0].date, "1967-01-27");
  assert.ok(events.every((e) => e.source.startsWith("https://www.nasa.gov/")));
  assert.equal(spatialDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});
test("actions reject wrong targets, unknown parameters and bounds without mutating state", () => {
  const s = pick("task-scheduler"),
    state = initialSceneState(s),
    before = JSON.stringify(state);
  for (const action of [
    act("set_parameter", { key: "executors", value: 0 }),
    act("set_parameter", { key: "partitions", value: 2.5 }),
    act("set_parameter", { key: "eval", value: 2 }),
    act("select", { id: "task-999" }),
    act("set_step", { step: 1152 }),
    act("fit_view", {}, "scene"),
    act("change_layer", { id: "invented", visible: false }, "layers"),
    act("compare", { enabled: true }, "view"),
  ]) {
    const result = transition(s, state, action);
    assert.equal(result.ok, false);
    assert.strictEqual(result.state, state);
    assert.ok(result.feedback);
  }
  assert.equal(JSON.stringify(state), before);
  const running = transition(s, state, act("play")).state;
  assert.equal(running.playing, true);
  assert.equal(transition(s, running, act("pause")).state.playing, false);
  const changed = transition(
    s,
    state,
    act("set_parameter", { key: "executors", value: 4 }),
  ).state;
  assert.notEqual(maxSceneStep(s, changed), maxSceneStep(s, state));
  assert.deepEqual(transition(s, changed, act("reset")).state, state);
});
test("serialization restores bounded layers, view and speed but never autoplay", () => {
  const scene = pick("dna-replication"),
    state = initialSceneState(scene);
  const changed = transition(
    scene,
    state,
    act("change_layer", { id: "enzymes", visible: false }, "layers"),
  ).state;
  changed.step = 3;
  changed.playing = true;
  changed.speed = 2;
  const restored = restoreSceneState(
    scene,
    JSON.parse(JSON.stringify(changed)),
  );
  assert.equal(restored.layers?.enzymes, false);
  assert.equal(restored.step, 3);
  assert.equal(restored.speed, 2);
  assert.equal(restored.playing, false);
  const graph = sceneFixtures[7],
    g = initialSceneState(graph),
    zoom = transition(
      graph,
      g,
      act("set_view", { zoom: 2, x: 80, y: -80 }, "view"),
    ).state;
  assert.equal(zoom.view?.zoom, 2);
  assert.deepEqual(
    transition(graph, zoom, act("fit_view", {}, "view")).state.view,
    g.view,
  );
  const dirty = {
    ...zoom,
    view: { ...zoom.view!, secret: "discard" },
    layers: { invented: true },
  };
  assert.deepEqual(restoreSceneState(graph, dirty).view, zoom.view);
  assert.deepEqual(restoreSceneState(graph, dirty).layers, {});
  assert.equal(
    transition(scene, { ...state, step: 3 }, act("replay")).state.step,
    0,
  );
});
test("new scene validation rejects oversized configurations, fabricated evidence and code", () => {
  const t = pick("historical-timeline");
  assert.throws(() =>
    validateScene({
      ...t,
      config: { ...t.config, eventIds: ["fake-event", "apollo7-launch"] },
    }),
  );
  assert.throws(() =>
    validateScene({
      ...t,
      config: { ...t.config, eventIds: ["apollo7-launch", "apollo7-launch"] },
    }),
  );
  assert.throws(() => validateScene({ ...data("filter"), script: "alert(1)" }));
  assert.throws(() =>
    validateScene({
      ...data("filter"),
      config: {
        ...data("filter").config,
        rows: [
          { id: "a", key: "A", value: 1.5 },
          { id: "b", key: "B", value: 2 },
        ],
      },
    }),
  );
  assert.throws(
    () => validateScene({ ...t, description: "x".repeat(33000) }),
    /size limit/,
  );
  const huge = structuredClone(referenceLessons[0].plan);
  huge.overview = "x".repeat(120001);
  assert.throws(
    () => validateUniversalPlan(huge, "Gradient descent"),
    /size limit/,
  );
});
