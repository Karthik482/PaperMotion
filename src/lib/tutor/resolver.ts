import { getTopic } from "../topics/storage";
import { getPaper } from "../papers/storage";
import { validateAnalysis } from "../papers/schemas";
import { legacyDiagram } from "../scenes/fallback";

import { initialSceneState } from "../scenes/simulation";
import {
  sceneSources,
  validatedState,
  computedMetrics,
  capabilityManifest,
  applyBatch,
} from "./context";
import type { TutorRequest, TutorSource } from "./schemas";
import { fingerprint } from "./schemas";
import { TutorError } from "./provider";
import { paperTutorScene } from "./paperScene";
export async function resolveContext(request: TutorRequest) {
  if (request.kind === "paper") {
    const paper = await getPaper(request.lessonId);
    if (!paper.analysis)
      throw new TutorError(
        "NO_ANALYSIS",
        "Analyze this paper before asking the evidence tutor.",
      );
    const result = validateAnalysis(
        paper.analysis.result,
        paper.extraction.passages,
      ),
      concept = result.concepts.find((c) => c.id === request.sceneId);
    if (request.sceneId !== "summary" && !concept)
      throw new TutorError(
        "INVALID_SCENE",
        "The requested paper concept does not exist.",
      );
    if (
      request.history.some(
        (t) =>
          t.sceneId !== "summary" &&
          !result.concepts.some((c) => c.id === t.sceneId),
      )
    )
      throw new TutorError(
        "INVALID_CONTEXT",
        "Conversation belongs to another paper.",
      );
    const scene = paperTutorScene(paper),
      state = initialSceneState(scene),
      claims = concept ? [concept] : [result.summary],
      passages = claims
        .flatMap((c) => c.evidence)
        .map(
          (e) => paper.extraction.passages.find((p) => p.id === e.passageId)!,
        );
    const sources: TutorSource[] = Array.from(
      new Map(passages.map((p) => [p.id, p])).values(),
    )
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        title: `${paper.extraction.title} · page ${p.page}`.slice(0, 300),
        kind: "paper",
        quote: p.text.slice(0, 1200),
        page: p.page,
        url: `/papers/${paper.id}`,
      }));
    return {
      scene,
      state,
      sources,
      navigation: [] as string[],
      readOnly: true,
      snapshot: {
        lessonId: paper.id,
        title: paper.extraction.title,
        sceneId: request.sceneId,
        level: request.level,
        explanation: (concept || result.summary)[request.level].slice(0, 1800),
        capabilities: capabilityManifest(scene, state, true),
        sources,
        readOnly: true,
      },
    };
  }
  const lesson = await getTopic(request.lessonId),
    step = lesson.plan.steps.find((s) => s.id === request.sceneId);
  if (!step)
    throw new TutorError(
      "INVALID_SCENE",
      "This scene does not belong to the active lesson.",
    );
  if (
    request.history.some(
      (t) => !lesson.plan.steps.some((s) => s.id === t.sceneId),
    )
  )
    throw new TutorError(
      "INVALID_CONTEXT",
      "Conversation belongs to another lesson.",
    );
  const scene = step.experience.scene || legacyDiagram(step),
    state = validatedState(scene, request.state);
  const sources = Array.from(
    new Map(
      lesson.plan.steps
        .flatMap((s) =>
          s.experience.scene ? sceneSources(s.experience.scene) : [],
        )
        .map((s) => [s.id, s]),
    ).values(),
  ).slice(0, 12);
  const experiments = request.experiments.map((e) => {
    const before = validatedState(scene, e.before),
      after = applyBatch(scene, before, e.actions);
    if (fingerprint(after) !== fingerprint(e.after))
      throw new TutorError(
        "INVALID_CONTEXT",
        "A previous experiment does not match its validated actions.",
      );
    return {
      actions: e.actions,
      before: computedMetrics(scene, before),
      after: computedMetrics(scene, after),
    };
  });
  const sceneConfig = JSON.parse(
    JSON.stringify(scene.config, (_key, value) =>
      typeof value === "string" ? value.slice(0, 400) : value,
    ),
  );
  const navigation = lesson.plan.steps.map((s) => ({
    id: s.id,
    title: s.title.slice(0, 180),
    type: s.experience.scene?.type || "illustrative",
    historicalEventIds:
      s.experience.scene?.type === "historical-timeline"
        ? s.experience.scene.config.eventIds
        : [],
  }));
  return {
    scene,
    state,
    sources,
    navigation: navigation.map((n) => n.id),
    readOnly: false,
    snapshot: {
      lessonId: lesson.id,
      title: lesson.plan.title,
      topic: lesson.topic,
      objectives: lesson.plan.objectives.map((o) => o.slice(0, 180)),
      sceneId: step.id,
      scene: {
        type: scene.type,
        title: scene.title,
        description: scene.description.slice(0, 800),
        config: sceneConfig,
      },
      level: request.level,
      mode: request.mode,
      state,
      outputs: computedMetrics(scene, state),
      capabilities: capabilityManifest(scene, state),
      explanation: step[request.level].slice(0, 1600),
      navigation,
      sources,
      experiments,
    },
  };
}
