"use client";
import { useEffect, useRef, useState } from "react";
import type { Scene } from "@/lib/scenes/schemas";
import type { SceneState } from "@/lib/scenes/simulation";
import {
  defaultTimeline,
  frameState,
  validateTimeline,
} from "@/lib/tutor/timeline";
import type { WatchTimeline } from "@/lib/tutor/schemas";
import type { useSceneSession } from "./useSceneSession";
type Sequence = {
  timeline: WatchTimeline;
  baseline: SceneState;
  index: number;
  running: boolean;
  speed: 0.5 | 1 | 2;
};
export function useWatch(
  scene: Scene,
  session: ReturnType<typeof useSceneSession>,
  reduced: boolean,
) {
  const [mode, setMode] = useState<"watch" | "explore">("explore"),
    [sequence, setSequence] = useState<Sequence | null>(null),
    ref = useRef(sequence);
  const [error, setError] = useState("");
  function update(next: Sequence | null) {
    ref.current = next;
    setSequence(next);
  }
  function pause() {
    if (ref.current?.running) update({ ...ref.current, running: false });
  }
  function make(timeline?: WatchTimeline) {
    const baseline = {
      ...structuredClone(session.ref.current),
      playing: false,
    };
    let verified: WatchTimeline;
    try {
      verified = validateTimeline(
        scene,
        baseline,
        timeline || scene.watch || defaultTimeline(scene, baseline),
      ).timeline;
      setError("");
    } catch {
      verified = defaultTimeline(scene, baseline);
      setError(
        "This saved sequence no longer fits the current controls. A local walkthrough is available using the current model.",
      );
    }
    const next: Sequence = {
      timeline: verified,
      baseline,
      index: -1,
      running: false,
      speed: ref.current?.speed || 1,
    };
    update(next);
    return next;
  }
  function move(index: number, source = ref.current) {
    if (!source) return;
    const bounded = Math.max(
      0,
      Math.min(source.timeline.frames.length - 1, index),
    );
    session.setState(
      frameState(scene, source.baseline, source.timeline, bounded),
    );
    update({
      ...source,
      index: bounded,
      running: source.running && bounded < source.timeline.frames.length - 1,
    });
  }
  function switchMode(next: "watch" | "explore") {
    pause();
    session.setState({ ...session.ref.current, playing: false });
    setMode(next);
    if (next === "watch" && !ref.current) make();
  }
  function play() {
    if (reduced) return;
    let current = ref.current || make();
    if (current.index >= current.timeline.frames.length - 1)
      current = make(current.timeline);
    if (current.index < 0) {
      move(0, current);
      current = ref.current!;
    }
    update({ ...current, running: true });
  }
  function replay() {
    pause();
    const current = make(ref.current?.timeline);
    move(0, current);
  }
  function manual() {
    pause();
    update(null);
  }
  function explain(timeline?: WatchTimeline) {
    pause();
    session.setState({ ...session.ref.current, playing: false });
    setMode("watch");
    const current = make(timeline);
    move(0, current);
  }
  useEffect(() => {
    if (reduced) pause();
  }, [reduced]);
  useEffect(() => {
    if (!sequence?.running || reduced) return;
    const timer = setTimeout(
      () => {
        const current = ref.current;
        if (current?.running) move(current.index + 1, current);
      },
      sequence.timeline.frames[Math.max(0, sequence.index)].durationMs /
        sequence.speed,
    );
    return () => clearTimeout(timer);
  }, [sequence, reduced]);
  return {
    mode,
    sequence,
    switchMode,
    pause,
    play,
    replay,
    manual,
    explain,
    move,
    speed: (speed: 0.5 | 1 | 2) => {
      if (ref.current) update({ ...ref.current, speed });
    },
    error,
    runSimulation: () => {
      pause();
      update(null);
      setMode("explore");
    },
  };
}
