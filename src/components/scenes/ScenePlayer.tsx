"use client";
import { validateScene } from "@/lib/scenes/schemas";
import { PlayerCore } from "./PlayerCore";
import type { TutorBinding } from "./useSceneSession";
export function ScenePlayer({
  scene,
  storageKey,
  detailsTarget,
  tutor,
  tutorTarget,
}: {
  scene: unknown;
  storageKey: string;
  detailsTarget?: HTMLElement | null;
  tutor?: TutorBinding;
  tutorTarget?: HTMLElement | null;
}) {
  let parsed;
  try {
    parsed = validateScene(scene);
  } catch {
    return (
      <p role="alert" className="research-error">
        This scene configuration is invalid and cannot be run.
      </p>
    );
  }
  return (
    <PlayerCore
      scene={parsed}
      storageKey={storageKey}
      detailsTarget={detailsTarget}
      tutor={tutor}
      tutorTarget={tutorTarget}
    />
  );
}
