import { test } from "node:test";
import assert from "node:assert/strict";
import { referenceLessons } from "../src/lib/topics/references";
import { initialSceneState } from "../src/lib/scenes/simulation";
import { transition } from "../src/lib/scenes/actions";
import { capabilityManifest, sceneSources } from "../src/lib/tutor/context";
import { providerReplySchema } from "../src/lib/tutor/providerSchema";
import { planCandidate } from "../src/lib/tutor/proposal";
import { defaultTimeline, validateTimeline } from "../src/lib/tutor/timeline";
import { sceneFixtures as scenes } from "./helpers/sceneFixture";
import { extendedSceneFixtures } from "./helpers/extendedSceneFixture";
import { validateScene } from "../src/lib/scenes/schemas";
import {
  universalPlannerSchema,
  validateUniversalPlan,
} from "../src/lib/topics/schemas";
import { zodTextFormat } from "openai/helpers/zod";
const reply = {
  version: 1,
  explanation: "A conceptual explanation.",
  clarification: null,
  actions: [],
  animation: null,
  elements: [],
  sourceIds: [],
  assumptions: [],
  caveats: [],
  suggestions: [],
};
test("structured provider vocabulary constrains evidence, elements, digits and unexpected resets", () => {
  const scene = referenceLessons[0].plan.steps[0].experience.scene!,
    context = {
      capabilities: capabilityManifest(scene, initialSceneState(scene)),
      sources: sceneSources(scene),
      navigation: [{ id: "step-1" }],
    };
  const schema = providerReplySchema(context, "What if the rate increases?");
  assert.equal(
    schema.safeParse({ ...reply, sourceIds: ["invented"] }).success,
    false,
  );
  assert.equal(
    schema.safeParse({ ...reply, explanation: "Invented loss is 123." })
      .success,
    false,
  );
  assert.equal(
    schema.safeParse({
      ...reply,
      actions: [{ version: 1, type: "reset", target: "scene", payload: {} }],
    }).success,
    false,
  );
  assert.equal(
    providerReplySchema(context, "Reset the scene").safeParse({
      ...reply,
      actions: [{ version: 1, type: "reset", target: "scene", payload: {} }],
    }).success,
    true,
  );
  assert.throws(() =>
    planCandidate(
      scene,
      initialSceneState(scene),
      {
        ...reply,
        actions: [
          {
            version: 1,
            type: "set_parameter",
            target: "scene",
            payload: { key: "learningRate", value: 1.2 },
          },
          { version: 1, type: "reset", target: "scene", payload: {} },
        ],
      },
      [],
    ),
  );
});
test("DNA actor focus reveals its correct authored stage and stepping back clears hidden highlights", () => {
  const scene = referenceLessons[3].plan.steps[0].experience.scene!,
    state = initialSceneState(scene),
    focused = transition(scene, state, {
      version: 1,
      type: "highlight",
      target: "scene",
      payload: { ids: ["dna-leading"] },
    });
  assert.equal(focused.ok, true);
  assert.equal(focused.state.step, 3);
  assert.deepEqual(focused.state.highlighted, ["dna-leading"]);
  const back = transition(scene, focused.state, {
    version: 1,
    type: "set_step",
    target: "scene",
    payload: { step: 0 },
  });
  assert.deepEqual(back.state.highlighted, []);
  assert.equal(state.step, 0);
});
test("every trusted renderer has a validated deterministic Watch fallback", () => {
  const all = Array.from(
    new Map(
      [
        ...scenes,
        ...extendedSceneFixtures,
        ...referenceLessons.flatMap((r) =>
          r.plan.steps.map((s) => s.experience.scene!),
        ),
      ].map((s) => [s.type, s]),
    ).values(),
  );
  assert.equal(all.length, 15);
  for (const scene of all) {
    const state = initialSceneState(scene);
    const result = validateTimeline(
      scene,
      state,
      defaultTimeline(scene, state),
    );
    assert.ok(result.timeline.frames.length);
    assert.ok(result.timeline.frames.length <= 24);
    assert.doesNotThrow(() =>
      validateScene({ ...scene, watch: result.timeline }),
    );
    assert.throws(() =>
      validateScene({
        ...scene,
        watch: {
          ...result.timeline,
          frames: [
            {
              caption: "Untrusted",
              durationMs: 500,
              actions: [
                {
                  version: 1,
                  type: "eval",
                  target: "scene",
                  payload: { code: "bad" },
                },
              ],
            },
          ],
        },
      }),
    );
  }
});
test("lesson planning stays compact while persisted lessons retain validated Watch sequences", () => {
  const format = zodTextFormat(universalPlannerSchema, "lesson_plan");
  assert.ok(JSON.stringify(format.schema).length < 60000);
  assert.doesNotThrow(() =>
    universalPlannerSchema.parse(referenceLessons[0].plan),
  );
  const plan = structuredClone(referenceLessons[0].plan),
    scene = plan.steps[0].experience.scene!;
  scene.watch = defaultTimeline(scene, initialSceneState(scene));
  assert.doesNotThrow(() =>
    validateUniversalPlan(plan, referenceLessons[0].topic),
  );
});
