import type { Scene } from "../scenes/schemas";
import type { SceneState } from "../scenes/simulation";
import {
  replySchema,
  fingerprint,
  type TutorReply,
  type TutorSource,
} from "./schemas";
import {
  applyBatch,
  capabilityManifest,
  computedMetrics,
  comparisonText,
  type Metric,
} from "./context";
import { validateTimeline } from "./timeline";
import type { SceneAction } from "../scenes/actions";
export type TutorProposal = {
  version: 1;
  lessonId: string;
  sceneId: string;
  revision: number;
  baseFingerprint: string;
  reply: TutorReply;
  before: Metric[];
  after: Metric[];
  afterState: SceneState;
  resultText: string;
  sources: TutorSource[];
  usage: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedUsd: number | null;
    cached?: boolean;
  };
};
export function planCandidate(
  scene: Scene,
  state: SceneState,
  input: unknown,
  sources: TutorSource[],
  navigation: string[] = [],
  readOnly = false,
) {
  if (JSON.stringify(input).length > 24000)
    throw new Error("Tutor reply is oversized");
  const reply = replySchema.parse(input),
    cap = capabilityManifest(scene, state, readOnly);
  if (reply.sourceIds.some((id) => !sources.some((s) => s.id === id)))
    throw new Error("Unknown source ID");
  if (reply.elements.some((id) => !cap.highlightable.includes(id)))
    throw new Error("Unknown visual element");
  if (readOnly && (reply.actions.length || reply.animation))
    throw new Error("This evidence view is read-only");
  const nav = reply.actions.filter((a) => a.type === "navigate_scene");
  if (
    nav.length &&
    (reply.actions.length !== 1 ||
      reply.animation ||
      !navigation.includes(nav[0].payload.sceneId))
  )
    throw new Error("Invalid scene navigation");
  const actions = reply.actions.filter(
    (a): a is SceneAction => a.type !== "navigate_scene",
  );
  if (actions.some((a, i) => a.type === "reset" && i > 0))
    throw new Error("Reset cannot erase earlier actions in the same proposal");
  if (actions.some((a) => !cap.actions.includes(a.type)))
    throw new Error("Unsupported scene action");
  const afterState = applyBatch(scene, state, actions);
  if (reply.animation) validateTimeline(scene, afterState, reply.animation);
  const quantitative = cap.parameters.length > 0;
  if (quantitative && /\d/.test(reply.explanation))
    throw new Error(
      "Numerical claims must use computed results, not generated prose",
    );
  const before = readOnly ? [] : computedMetrics(scene, state),
    after = readOnly ? [] : computedMetrics(scene, afterState);
  return {
    reply,
    afterState,
    before,
    after,
    resultText: readOnly
      ? "Evidence-backed reading context; no simulation is run."
      : actions.length
        ? comparisonText(before, after)
        : before
            .map((m) => `${m.label}: ${m.value}${m.unit ? " " + m.unit : ""}`)
            .join("\n"),
  };
}
export function commitProposal(
  scene: Scene,
  state: SceneState,
  revision: number,
  proposal: TutorProposal,
  lessonId: string,
  sceneId: string,
  navigation: string[] = [],
) {
  if (
    proposal.lessonId !== lessonId ||
    proposal.sceneId !== sceneId ||
    proposal.revision !== revision ||
    proposal.baseFingerprint !== fingerprint(state)
  )
    return {
      ok: false,
      state,
      feedback:
        "The scene changed while this answer was being prepared. Ask again using the current state.",
    };
  try {
    const result = planCandidate(
      scene,
      state,
      proposal.reply,
      proposal.sources,
      navigation,
    );
    if (fingerprint(result.afterState) !== fingerprint(proposal.afterState))
      throw new Error("Computed state mismatch");
    return {
      ok: true,
      state: result.afterState,
      feedback: result.reply.actions.some((a) => a.type === "navigate_scene")
        ? "Opening the requested lesson step."
        : `Applied locally.\n${result.resultText}`,
    };
  } catch {
    return {
      ok: false,
      state,
      feedback: "This action sequence could not be validated. Nothing changed.",
    };
  }
}
