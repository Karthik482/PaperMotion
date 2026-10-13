"use client";
import type { PaperRecord } from "@/lib/papers/schemas";
import { paperTutorScene } from "@/lib/tutor/paperScene";
import { initialSceneState } from "@/lib/scenes/simulation";
import { TutorPanel } from "./TutorPanel";
import type { TutorSource } from "@/lib/tutor/schemas";
export function PaperTutor({
  paper,
  conceptId,
  level,
  onSource,
}: {
  paper: PaperRecord;
  conceptId: string;
  level: "beginner" | "technical";
  onSource?: (s: TutorSource) => void;
}) {
  const state = initialSceneState(paperTutorScene(paper));
  return (
    <TutorPanel
      binding={{
        kind: "paper",
        lessonId: paper.id,
        sceneId: conceptId,
        level,
        navigation: [],
        onNavigate: () => {},
      }}
      revision={0}
      capture={() => ({ state, revision: 0, mode: "explore", experiments: [] })}
      apply={() => ({ ok: false, feedback: "Paper evidence is read-only." })}
      readOnly
      onSource={onSource}
      suggestions={[
        "Explain this evidence more simply.",
        "What limitations does the paper state?",
        "How does this concept relate to the findings?",
      ]}
    />
  );
}
