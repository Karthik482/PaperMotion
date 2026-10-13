"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonHeader } from "@/components/layout/LessonHeader";
import { lesson } from "@/data/transformerLesson";
import { VisualizationRegistry } from "@/components/visualizations/VisualizationRegistry";
import { useReducedMotion } from "@/components/layout/useReducedMotion";
import { ExplanationPanel } from "./ExplanationPanel";
import { KnowledgeCheck } from "./KnowledgeCheck";
export function LessonViewer({
  initialModule = 1,
}: {
  initialModule?: number;
}) {
  const [active, setActive] = useState(initialModule),
    [completed, setCompleted] = useState<number[]>([]),
    [query, setQuery] = useState(2),
    [temperature, setTemperature] = useState(1),
    [heads, setHeads] = useState(4),
    [playing, setPlaying] = useState(false),
    [phase, setPhase] = useState(0),
    [resetVersion, setResetVersion] = useState(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);
  const module = lesson.modules[active];
  useEffect(() => {
    if (!playing || reducedMotion) return;
    const timer = setInterval(() => {
      setPhase((p) => p + 1);
      setQuery((q) => (q + 1) % 6);
    }, 1600);
    return () => clearInterval(timer);
  }, [playing, reducedMotion]);
  const select = (i: number) => {
    setActive(i);
    setPlaying(false);
    setPhase(0);
  };
  const reset = () => {
    setPlaying(false);
    setPhase(0);
    setQuery(2);
    setTemperature(1);
    setHeads(4);
    setResetVersion((v) => v + 1);
  };
  const markComplete = () =>
    setCompleted((prev) => (prev.includes(active) ? prev : [...prev, active]));
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to lesson
      </a>
      <Sidebar active={active} completed={completed} onSelect={select} />
      <main id="main-content" className="lesson-main">
        <LessonHeader />
        <div className="lesson-body">
          <div className="module-heading">
            <div>
              <span className="eyebrow">{module.eyebrow}</span>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
            </div>
            <span className="module-count">
              {String(active + 1).padStart(2, "0")} <span>/ 06</span>
            </span>
          </div>
          <div className="exploration-layout">
            <section
              className="visualization-card"
              aria-label="Interactive visualization"
            >
              <VisualizationRegistry
                key={`${module.id}:${resetVersion}`}
                type={module.visualization}
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
              {module.visualization !== "check" && (
                <div className="playback">
                  {(module.visualization === "attention" ||
                    module.visualization === "multihead") && (
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
                      aria-label={
                        reducedMotion
                          ? "Next query"
                          : playing
                            ? "Pause animation"
                            : "Play animation"
                      }
                    >
                      {reducedMotion ? (
                        <ArrowRight size={15} />
                      ) : playing ? (
                        <Pause size={15} />
                      ) : (
                        <Play size={15} />
                      )}{" "}
                      {reducedMotion
                        ? "Next query"
                        : playing
                          ? "Pause"
                          : "Play animation"}
                    </button>
                  )}
                  <button className="reset-button" onClick={reset}>
                    <RotateCcw size={15} />
                    Reset
                  </button>
                  <span>
                    {reducedMotion
                      ? "Manual exploration"
                      : playing
                        ? "Following each query word"
                        : "Change a selection to explore"}
                  </span>
                </div>
              )}
            </section>
            <aside className="explainer">
              <span className="eyebrow">
                <SlidersHorizontal size={14} /> EXPLORER NOTES
              </span>
              <p className="mobile-description">{module.description}</p>
              <h3>
                {
                  [
                    "Trace the information flow.",
                    "Context is a conversation.",
                    "Several views of one sentence.",
                    "Give every token a position.",
                    "Keep the future out of view.",
                    "Connect the whole pipeline.",
                  ][active]
                }
              </h3>
              <p>
                {active === 1 ? (
                  <>
                    When the model reads{" "}
                    <strong>“{tokensForQuery(query)}”</strong>, it looks at
                    other words for context. The thicker the connection, the
                    more attention that word receives.
                  </>
                ) : (
                  module.takeaway
                )}
              </p>
              <div className="note-divider" />
              <span className="note-label">TRY THIS</span>
              <ol>
                {[
                  [
                    "Select an encoder layer.",
                    "Compare it with a decoder layer.",
                    "Read what each selected layer does.",
                  ],
                  [
                    "Select a different word.",
                    "Lower the temperature.",
                    "Watch attention become focused.",
                  ],
                  [
                    "Select a query word.",
                    "Compare two heads, then eight.",
                    "Look for different distributions.",
                  ],
                  [
                    "Move the token position slider.",
                    "Compare the eight signal dimensions.",
                    "Reset to the starting position.",
                  ],
                  [
                    "Select an early word.",
                    "Compare it with a later word.",
                    "Notice which future positions stay masked.",
                  ],
                  [
                    "Trace the five stages in order.",
                    "Revisit a module that is unclear.",
                    "Answer the final knowledge check.",
                  ],
                ][active].map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
              <div className="notebook">
                <span>↳ A small detail</span>
                <p>
                  {active === 1
                    ? "Temperature is an exploration control added for this lesson. The paper uses T = 1."
                    : "These visualizations simplify the original model to focus on one idea at a time."}
                </p>
              </div>
              <span className="toy-badge">
                ILLUSTRATIVE MODEL · NOT TRAINED
              </span>
            </aside>
          </div>
          <ExplanationPanel text={module.takeaway} />
          <KnowledgeCheck
            key={module.id}
            module={module}
            onCorrect={markComplete}
          />
          <footer className="lesson-footer">
            <button disabled={active === 0} onClick={() => select(active - 1)}>
              <ArrowLeft size={16} /> Previous
            </button>
            <span>
              {completed.includes(active) ? (
                <>
                  <Check size={14} /> Module completed
                </>
              ) : (
                "Answer the check to complete this module"
              )}
            </span>
            <button
              className="next-button"
              disabled={active === 5}
              onClick={() => select(active + 1)}
            >
              Next module <ArrowRight size={16} />
            </button>
          </footer>
          <div className="site-footer">
            PAPERMOTION{" "}
            <span>Ideas are easier to understand when you can touch them.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
function tokensForQuery(q: number) {
  return ["The", "robot", "learned", "to", "read", "papers"][q];
}
