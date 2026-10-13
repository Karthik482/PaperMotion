"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { ScenePlayer } from "@/components/scenes/ScenePlayer";
import { legacyDiagram } from "@/lib/scenes/fallback";
import { ExplanationSwitch } from "@/components/layout/ExplanationSwitch";
import { PaperShell } from "@/components/papers/PaperShell";
import { ResponsiveOutline } from "@/components/layout/ResponsiveOutline";
import { useReducedMotion } from "@/components/layout/useReducedMotion";
import { KnowledgeCheck } from "@/components/lesson/KnowledgeCheck";
import { VisualizationRegistry } from "@/components/visualizations/VisualizationRegistry";
import { templateCapabilities } from "@/lib/topics/capabilities";
import type { TopicRecord } from "@/lib/topics/schemas";
export function TopicReader({ id }: { id: string }) {
  const [tutorTarget, setTutorTarget] = useState<HTMLDivElement | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<HTMLDivElement | null>(
    null,
  );
  const [lesson, setLesson] = useState<TopicRecord | null>(null),
    [error, setError] = useState(""),
    [active, setActive] = useState(0),
    [mode, setMode] = useState<"beginner" | "technical">("beginner"),
    [completed, setCompleted] = useState<string[]>([]),
    [playerReady, setPlayerReady] = useState(false);
  const [query, setQuery] = useState(2),
    [temperature, setTemperature] = useState(1),
    [heads, setHeads] = useState(4),
    [phase, setPhase] = useState(0),
    [playing, setPlaying] = useState(false),
    [resetVersion, setResetVersion] = useState(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/topics/${id}`, { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setLesson(d.lesson);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [id]);
  useEffect(() => {
    try {
      const data = JSON.parse(
        localStorage.getItem(`topic-progress:${id}`) || "[]",
      );
      if (Array.isArray(data))
        setCompleted(data.filter((x: unknown) => typeof x === "string"));
    } catch {}
  }, [id]);
  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = setInterval(() => {
      setQuery((q) => (q + 1) % 6);
      setPhase((p) => p + 1);
    }, 1600);
    return () => clearInterval(timer);
  }, [playing, reducedMotion]);
  useEffect(() => {
    if (!lesson) return;
    let position = 0,
      level = lesson.level || "beginner";
    try {
      const saved = JSON.parse(
        localStorage.getItem(`lesson-player:v2:${id}`) || "null",
      );
      if (saved) {
        if (
          Number.isInteger(saved.active) &&
          saved.active >= 0 &&
          saved.active < lesson.plan.steps.length
        )
          position = saved.active;
        if (saved.mode === "beginner" || saved.mode === "technical")
          level = saved.mode;
      }
    } catch {}
    setActive(position);
    setMode(level);
    setPlayerReady(true);
  }, [lesson, id]);
  useEffect(() => {
    if (playerReady)
      try {
        localStorage.setItem(
          `lesson-player:v2:${id}`,
          JSON.stringify({ active, mode }),
        );
      } catch {}
  }, [active, mode, playerReady, id]);
  function select(i: number) {
    setActive(i);
    setPlaying(false);
    setPhase(0);
  }
  function complete() {
    if (!lesson) return;
    setCompleted((prev) => {
      const next = Array.from(new Set([...prev, lesson.plan.steps[active].id]));
      try {
        localStorage.setItem(`topic-progress:${id}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }
  function exportPlan() {
    if (!lesson) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(lesson, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `papermotion-lesson-${id.slice(0, 12)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const step = lesson?.plan.steps[active],
    template = step?.experience.templateId;
  const scene =
    step?.experience.scene ||
    (step && template === "none" ? legacyDiagram(step) : null);
  return (
    <PaperShell className="lesson-workspace">
      <Link href="/" className="back-library">
        <ArrowLeft size={14} /> Explore another topic
      </Link>
      {!lesson || !step ? (
        <div className="reader-loading">
          {error ? (
            <p className="research-error" role="alert">
              {error}
            </p>
          ) : (
            <p role="status">Opening your learning path…</p>
          )}
        </div>
      ) : (
        <>
          <section className="reader-heading">
            <div>
              <span className="eyebrow">
                {lesson.plan.domain.toUpperCase()} · YOUR LEARNING PATH
              </span>
              <h1>{lesson.plan.title}</h1>
              <div className="reader-meta">
                <span>{lesson.plan.steps.length} steps</span>
                <span className="paper-state analyzed">Saved locally</span>
                <details className="lesson-overview">
                  <summary>About this lesson</summary>
                  <p>{lesson.plan.overview}</p>
                </details>
              </div>
            </div>
            <div className="reader-actions">
              <button onClick={exportPlan} aria-label="Export lesson">
                <Download size={14} /> Export lesson
              </button>
            </div>
          </section>
          <div className="topic-lesson-layout">
            <aside className="topic-step-sidebar">
              <ResponsiveOutline
                label="Learning path"
                count={lesson.plan.steps.length}
                collapseAt={1023}
              >
                <nav aria-label="Learning steps">
                  {lesson.plan.steps.map((s, i) => (
                    <button
                      key={s.id}
                      className={i === active ? "selected" : ""}
                      aria-current={i === active ? "step" : undefined}
                      onClick={() => select(i)}
                    >
                      <span>
                        {completed.includes(s.id) ? (
                          <Check size={14} />
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>
                      {s.title}
                    </button>
                  ))}
                </nav>
              </ResponsiveOutline>
              <div className="topic-progress">
                <progress
                  aria-label="Learning path completion"
                  value={
                    completed.filter((id) =>
                      lesson.plan.steps.some((s) => s.id === id),
                    ).length
                  }
                  max={lesson.plan.steps.length}
                />
                <span>
                  {
                    completed.filter((id) =>
                      lesson.plan.steps.some((s) => s.id === id),
                    ).length
                  }{" "}
                  / {lesson.plan.steps.length} understood
                </span>
                <small>Answer a check to mark a step complete.</small>
              </div>
              <details className="topic-preconditions">
                <summary>Before you begin</summary>
                {lesson.plan.prerequisites.length ? (
                  <ul>
                    {lesson.plan.prerequisites.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No prior knowledge required.</p>
                )}
                <strong>You’ll learn to</strong>
                <ul>
                  {lesson.plan.objectives.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </details>
            </aside>
            <section className="topic-step-content">
              <div className="topic-step-heading">
                <div>
                  <span className="eyebrow">
                    STEP {String(active + 1).padStart(2, "0")}
                  </span>
                  <h2>{step.title}</h2>
                </div>
                <ExplanationSwitch value={mode} onChange={setMode} />
              </div>
              <div className="topic-scene-stage">
                {scene && (
                  <ScenePlayer
                    key={step.id}
                    scene={scene}
                    storageKey={`${id}:${step.id}`}
                    detailsTarget={detailsTarget}
                    tutorTarget={tutorTarget}
                    tutor={{
                      kind: "topic",
                      lessonId: id,
                      sceneId: step.id,
                      level: mode,
                      navigation: lesson.plan.steps.map((s) => s.id),
                      onNavigate: (sceneId) => {
                        const index = lesson.plan.steps.findIndex(
                          (s) => s.id === sceneId,
                        );
                        if (index >= 0) select(index);
                      },
                    }}
                  />
                )}
                {!scene && template && template !== "none" ? (
                  <section className="topic-live-interaction">
                    <div className="topic-interaction-heading">
                      <span className="eyebrow">
                        TRY IT ·{" "}
                        {templateCapabilities[template].name.toUpperCase()}
                      </span>
                      <p>{step.experience.suggestedInteraction}</p>
                      <small>{step.experience.rationale}</small>
                    </div>
                    <div className="visualization-card">
                      <VisualizationRegistry
                        key={`${step.id}:${resetVersion}`}
                        type={template}
                        controls={{
                          query,
                          setQuery,
                          temperature,
                          setTemperature,
                          heads,
                          setHeads,
                          phase,
                          playing: playing && !reducedMotion,
                        }}
                      />
                      <div className="playback">
                        {(template === "attention" ||
                          template === "multihead") && (
                          <button
                            className="play-button"
                            onClick={() => {
                              if (reducedMotion) {
                                setQuery((q) => (q + 1) % 6);
                                return;
                              }
                              setPlaying((p) => !p);
                              setPhase((p) => p || 1);
                            }}
                          >
                            {reducedMotion ? (
                              <ArrowRight size={14} />
                            ) : playing ? (
                              <Pause size={14} />
                            ) : (
                              <Play size={14} />
                            )}{" "}
                            {reducedMotion
                              ? "Next query"
                              : playing
                                ? "Pause"
                                : "Play animation"}
                          </button>
                        )}
                        <button
                          className="reset-button"
                          onClick={() => {
                            setPlaying(false);
                            setPhase(0);
                            setQuery(2);
                            setTemperature(1);
                            setHeads(4);
                            setResetVersion((v) => v + 1);
                          }}
                        >
                          <RotateCcw size={14} /> Reset
                        </button>
                      </div>
                    </div>
                  </section>
                ) : !scene ? (
                  <details className="planned-interaction">
                    <summary>Proposed interaction - not available yet</summary>
                    <p>{step.experience.suggestedInteraction}</p>
                    <small>{step.experience.rationale}</small>
                    <span className="interaction-not-ready">
                      Interactive scene not available yet · explanation and
                      knowledge check are ready
                    </span>
                  </details>
                ) : null}
              </div>
              <aside
                className="topic-context"
                aria-label="Contextual explanations"
              >
                <div className="tutor-host" ref={setTutorTarget} />
                <details className="context-notes" open>
                  <summary>Explanation &amp; notes</summary>
                  <div
                    className="selected-element-host"
                    ref={setDetailsTarget}
                  />
                  <article className="topic-explanation">
                    <p>{step[mode]}</p>
                  </article>
                  <div className="topic-example">
                    <span className="eyebrow">Worked example</span>
                    <p>{step.example}</p>
                  </div>
                  <div className="topic-misconception">
                    <span className="eyebrow">Watch for this</span>
                    <p>{step.misconception}</p>
                  </div>
                  <KnowledgeCheck
                    key={step.id}
                    module={{
                      id: step.id,
                      title: step.title,
                      eyebrow: "",
                      description: step.beginner,
                      visualization: "check",
                      takeaway: step.misconception,
                      ...step.check,
                    }}
                    onCorrect={complete}
                  />
                </details>
              </aside>
              <footer className="lesson-footer">
                <button
                  disabled={active === 0}
                  onClick={() => select(active - 1)}
                >
                  <ArrowLeft size={15} /> Previous step
                </button>
                <span>
                  {completed.includes(step.id)
                    ? "Step understood"
                    : "Check your understanding above"}
                </span>
                <button
                  className="next-button"
                  disabled={active === lesson.plan.steps.length - 1}
                  onClick={() => select(active + 1)}
                >
                  Next step <ArrowRight size={15} />
                </button>
              </footer>
            </section>
          </div>
          {lesson.plan.limitations.length > 0 && (
            <details className="topic-plan-limitations">
              <summary>Scope and limitations of this lesson</summary>
              <ul>
                {lesson.plan.limitations.map((l, i) => (
                  <li key={`${i}:${l}`}>{l}</li>
                ))}
              </ul>
            </details>
          )}
          <div className="reader-provenance">
            {lesson.reference ? "Authored reference lesson" : "Saved lesson"} ·{" "}
            {lesson.model} · plan v{lesson.version} · reopening makes no API
            calls.{" "}
            {lesson.reference
              ? "Models are simplified; source links and assumptions appear with each scene."
              : "AI explanations are not verified against sources; planning and review can still contain errors."}
          </div>
        </>
      )}
    </PaperShell>
  );
}
