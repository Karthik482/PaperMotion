"use client";
import { validateScene } from "@/lib/scenes/schemas";
import { PlayerCore } from "./PlayerCore";
export function ScenePlayer({
  scene,
  storageKey,
  detailsTarget,
}: {
  scene: unknown;
  storageKey: string;
  detailsTarget?: HTMLElement | null;
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
    />
  );
}
