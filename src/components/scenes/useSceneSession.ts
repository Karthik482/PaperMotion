"use client";
import { useEffect, useRef, useState } from "react";
import type { Scene } from "@/lib/scenes/schemas";
import { initialSceneState, type SceneState } from "@/lib/scenes/simulation";
import type { SceneAction } from "@/lib/scenes/actions";
import { commitProposal, type TutorProposal } from "@/lib/tutor/proposal";
import {
  experimentSchema,
  fingerprint,
  type TutorRequest,
} from "@/lib/tutor/schemas";
import { applyBatch, validatedState } from "@/lib/tutor/context";
import { z } from "zod";
export type TutorBinding = {
  kind: "topic" | "paper";
  lessonId: string;
  sceneId: string;
  level: "beginner" | "technical";
  navigation: string[];
  onNavigate: (id: string) => void;
};
export type SceneSnapshot = {
  state: SceneState;
  revision: number;
  mode: "watch" | "explore";
  experiments: TutorRequest["experiments"];
};
// Update the ref synchronously, before React renders, so late answers cannot
// overwrite a slider movement or an animation frame from the same event loop.
export function useSceneSession(
  scene: Scene,
  binding?: TutorBinding,
  storageKey?: string,
) {
  const [state, renderState] = useState(() => initialSceneState(scene)),
    ref = useRef(state),
    revisionRef = useRef(0);
  const [revision, renderRevision] = useState(0),
    experiments = useRef<TutorRequest["experiments"]>([]);
  const experimentKey = `scene-experiments:v1:${storageKey}`;
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = z
        .array(experimentSchema)
        .max(3)
        .parse(JSON.parse(localStorage.getItem(experimentKey) || "[]"));
      experiments.current = saved.filter(
        (e) =>
          fingerprint(
            applyBatch(scene, validatedState(scene, e.before), e.actions),
          ) === fingerprint(e.after),
      );
    } catch {
      experiments.current = [];
    }
  }, [experimentKey]);
  function setState(next: SceneState | ((state: SceneState) => SceneState)) {
    const value = typeof next === "function" ? next(ref.current) : next;
    ref.current = value;
    revisionRef.current++;
    renderState(value);
    renderRevision(revisionRef.current);
  }
  function remember(
    before: SceneState,
    after: SceneState,
    actions: SceneAction[],
  ) {
    if (!actions.length) return;
    experiments.current = [
      ...experiments.current,
      {
        before: { ...structuredClone(before), playing: false },
        after: structuredClone(after),
        actions,
      },
    ].slice(-3);
    if (storageKey)
      try {
        localStorage.setItem(
          experimentKey,
          JSON.stringify(experiments.current),
        );
      } catch {}
  }
  function apply(proposal: TutorProposal) {
    if (!binding)
      return { ok: false, feedback: "This scene has no tutor binding." };
    const result = commitProposal(
      scene,
      ref.current,
      revisionRef.current,
      proposal,
      binding.lessonId,
      binding.sceneId,
      binding.navigation,
    );
    if (result.ok) {
      const nav = proposal.reply.actions.find(
        (a) => a.type === "navigate_scene",
      );
      if (nav?.type === "navigate_scene")
        binding.onNavigate(nav.payload.sceneId);
      else {
        remember(
          ref.current,
          result.state,
          proposal.reply.actions.filter(
            (a): a is SceneAction => a.type !== "navigate_scene",
          ),
        );
        setState(result.state);
      }
    }
    return result;
  }
  function capture(mode: "watch" | "explore"): SceneSnapshot {
    if (ref.current.playing) setState({ ...ref.current, playing: false });
    return {
      state: structuredClone(ref.current),
      revision: revisionRef.current,
      mode,
      experiments: structuredClone(experiments.current),
    };
  }
  return {
    state,
    setState,
    revision,
    ref,
    remember,
    apply,
    capture,
    invalidate: () => setState({ ...ref.current }),
    fingerprint: () => fingerprint(ref.current),
  };
}
