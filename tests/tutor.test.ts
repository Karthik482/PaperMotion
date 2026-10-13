import { test } from "node:test";
import assert from "node:assert/strict";
import { referenceLessons } from "../src/lib/topics/references";
import {
  computedMetrics,
  capabilityManifest,
  validatedState,
  applyBatch,
  sceneSources,
} from "../src/lib/tutor/context";
import { initialSceneState } from "../src/lib/scenes/simulation";
import {
  replySchema,
  tutorRequestSchema,
  fingerprint,
} from "../src/lib/tutor/schemas";
test("compact context uses actual local outputs and scene-specific capabilities", () => {
  for (const r of referenceLessons) {
    const scene = r.plan.steps[0].experience.scene!,
      state = initialSceneState(scene);
    assert.ok(computedMetrics(scene, state).length);
    assert.equal(capabilityManifest(scene, state).type, scene.type);
    assert.deepEqual(validatedState(scene, state), state);
    assert.throws(() =>
      validatedState(scene, {
        ...state,
        parameters: { ...state.parameters, unknown: 1 },
      }),
    );
  }
  const s = referenceLessons[1].plan.steps[0].experience.scene!,
    state = initialSceneState(s),
    after = applyBatch(s, state, [
      {
        version: 1,
        type: "set_parameter",
        target: "scene",
        payload: { key: "executors", value: 4 },
      },
    ]);
  assert.equal(
    computedMetrics(s, state).find((m) => m.label === "Estimated job time")!
      .value,
    4,
  );
  assert.equal(
    computedMetrics(s, after).find((m) => m.label === "Estimated job time")!
      .value,
    2,
  );
  assert.equal(state.parameters.executors, 2);
});
test("tutor schemas reject executable fields, oversized messages and unknown targets", () => {
  assert.equal(
    replySchema.safeParse({
      version: 1,
      explanation: "A concept",
      clarification: null,
      actions: [],
      animation: null,
      elements: [],
      sourceIds: [],
      assumptions: [],
      caveats: [],
      suggestions: [],
      code: "eval()",
    }).success,
    false,
  );
  assert.equal(
    tutorRequestSchema.safeParse({ message: "x".repeat(1201) }).success,
    false,
  );
  assert.equal(fingerprint({ b: 2, a: 1 }), fingerprint({ a: 1, b: 2 }));
  const s = referenceLessons[4].plan.steps[2].experience.scene!;
  assert.equal(sceneSources(s).length, 6);
  assert.ok(
    sceneSources(s).every((s) => s.url?.startsWith("https://www.nasa.gov/")),
  );
});
