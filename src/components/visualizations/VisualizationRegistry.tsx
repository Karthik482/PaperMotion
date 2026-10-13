import { useState } from "react";
import type { LessonModule } from "@/types/lesson";
import { tokens } from "@/data/transformerLesson";
import { AttentionExplorer } from "./AttentionExplorer";
import { TransformerArchitecture } from "./TransformerArchitecture";
import { MultiHeadAttention } from "./MultiHeadAttention";
export type VizControls = {
  query: number;
  setQuery: (q: number) => void;
  temperature: number;
  setTemperature: (t: number) => void;
  heads: number;
  setHeads: (h: number) => void;
  phase: number;
  playing: boolean;
};
function Positions() {
  const [position, setPosition] = useState(2);
  return (
    <>
      <div className="viz-toolbar">
        <span>POSITION SIGNALS</span>
        <span>8 illustrative dimensions</span>
      </div>
      <h3 className="position-title">Every position has a signature.</h3>
      <div className="position-viz">
        {Array.from({ length: 8 }, (_, d) => (
          <div key={d}>
            <span>d{d}</span>
            <svg
              viewBox="0 0 400 40"
              preserveAspectRatio="none"
              aria-label={`Position encoding dimension ${d}`}
            >
              <polyline
                fill="none"
                stroke="#ad472e"
                strokeWidth="2"
                points={Array.from(
                  { length: 50 },
                  (_, p) =>
                    `${p * 8},${(20 - 16 * (d % 2 === 0 ? Math.sin(p / Math.pow(10000, (2 * Math.floor(d / 2)) / 8)) : Math.cos(p / Math.pow(10000, (2 * Math.floor(d / 2)) / 8)))).toFixed(4)}`,
                ).join(" ")}
              />
              <circle
                cx={position * 8}
                cy={(
                  20 -
                  16 *
                    (d % 2 === 0
                      ? Math.sin(
                          position /
                            Math.pow(10000, (2 * Math.floor(d / 2)) / 8),
                        )
                      : Math.cos(
                          position /
                            Math.pow(10000, (2 * Math.floor(d / 2)) / 8),
                        ))
                ).toFixed(4)}
                r="4"
                fill="#913821"
              />
            </svg>
          </div>
        ))}
      </div>
      <label className="position-slider">
        Token position: {position}
        <input
          aria-label="Token position"
          type="range"
          min="0"
          max="49"
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
        />
      </label>
      <div className="formula">
        <code>PE(pos, 2i) = sin(pos / 10000^(2i/d))</code>
        <code>PE(pos, 2i+1) = cos(pos / 10000^(2i/d))</code>
      </div>
    </>
  );
}
function Decoder() {
  const [step, setStep] = useState(2);
  return (
    <>
      <div className="viz-toolbar">
        <span>CAUSAL SELF-ATTENTION</span>
        <span>Future tokens are masked</span>
      </div>
      <div className="tokens compact">
        {tokens.map((t, i) => (
          <button
            key={i}
            className={step === i ? "selected" : ""}
            aria-pressed={step === i}
            onClick={() => setStep(i)}
          >
            {t}
          </button>
        ))}
      </div>
      <div
        className="mask-grid"
        role="img"
        aria-label={`Causal attention mask, selected position ${step + 1}`}
      >
        {tokens.map((t, row) => (
          <div key={row}>
            <span>{t}</span>
            {tokens.map((_, col) => (
              <i
                key={col}
                className={
                  (col > row ? "masked" : "allowed") +
                  (row === step ? " mask-active" : "")
                }
              >
                {col > row ? "×" : "•"}
              </i>
            ))}
          </div>
        ))}
      </div>
      <p className="viz-note">
        Row = query · Column = key. For “{tokens[step]}”, {step + 1} positions
        are accessible. Input outputs are shifted right during training.
      </p>
    </>
  );
}
export function VisualizationRegistry({
  type,
  controls,
}: {
  type: LessonModule["visualization"];
  controls: VizControls;
}) {
switch (type) {
    case "architecture":
      return (
        <TransformerArchitecture
          phase={controls.playing ? controls.phase : 0}
        />
      );
    case "attention":
      return <AttentionExplorer {...controls} />;
    case "multihead":
      return <MultiHeadAttention {...controls} />;
    case "position":
      return <Positions />;
    case "decoder":
      return <Decoder />;
    case "task-scheduler":
      return (
        <div className="recap">
          <span>SPARK-STYLE TASK SCHEDULING</span>
          <h2>
            Parallel processing with unified planning.
          </h2>
          <div>
            {[
              "Driver plans stages & distributes tasks",
              "Cluster manager allocates executor resources",
              "Tasks execute in parallel across workers",
              "Progress tracked by completed tasks count",
              "Compare baseline vs. current configuration",
            ].map((x, i) => (
              <p key={x}>
                <b>0{i + 1}</b>
                {x}
              </p>
            ))}
          </div>
          <small>Explore Spark-style distributed execution.</small>
        </div>
      );
    case "supply-demand":
      return (
        <div className="recap">
          <span>LINEAR MARKET EQUILIBRIUM</span>
          <h2>
            Demand and supply curves intersect.
          </h2>
          <div>
            {[
              "Demand: P = a − bQ + shiftD",
              "Supply: P = c + dQ + shiftS",
              "Equilibrium: solve for Q* and P*",
              "Feasibility: Q* ≥ 0, P* ≥ 0",
              "Compare with configured baseline",
            ].map((x, i) => (
              <p key={x}>
                <b>0{i + 1}</b>
                {x}
              </p>
            ))}
          </div>
          <small>Illustrate market equilibrium concepts.</small>
        </div>
      );
    case "dna-replication":
      return (
        <div className="recap">
          <span>DNA FORK MECHANISM</span>
          <h2>
            Five-stage replication process.
          </h2>
          <div>
            {[
              "Parent duplex separates",
              "Primase lays RNA primers",
              "Polymerase extends 5′→3′",
              "Ligase seals fragments",
              "Two daughter duplexes form",
            ].map((x, i) => (
              <p key={x}>
                <b>0{i + 1}</b>
                {x}
              </p>
            ))}
          </div>
          <small>Explore the local DNA fork mechanism.</small>
        </div>
      );
    case "historical-timeline":
      return (
        <div className="recap">
          <span>HISTORY OF APOLLO FLIGHTS</span>
          <h2>
            Source-backed chronological events.
          </h2>
          <div>
            {[
              "Apollo 1 fire: redesign spacecraft",
              "Apollo 7 launch: Earth-orbit test",
              "Apollo 8 orbit: Moon photography",
              "Apollo 9 launch: LM testing",
              "Apollo 10 launch: lunar rehearsal",
              "Apollo 11 landing: Moon visit",
            ].map((x, i) => (
              <p key={x}>
                <b>0{i + 1}</b>
                {x}
              </p>
            ))}
          </div>
          <small>Compare timeline tracks vs. baseline.</small>
        </div>
      );
    case "data-explorer":
      return (
        <div className="recap">
          <span>BASIC DATA OPERATIONS</span>
          <h2>
            Filter, join, or sort local tables.
          </h2>
          <div>
            {[
              "Filter rows based on threshold",
              "Left join with another table",
              "Bubble-sort adjacent comparisons",
              "Step through execution trace",
              "Compare input vs. output",
            ].map((x, i) => (
              <p key={x}>
                <b>0{i + 1}</b>
                {x}
              </p>
            ))}
          </div>
          <small>Explore bounded data operations.</small>
        </div>
      );
    case "check":
      return (
        <div className="recap">
          <span>FROM WORDS TO UNDERSTANDING</span>
          <h2>
            One architecture.
            <br />A new way to pay attention.
          </h2>
          <div>
            {["Embed + position",
              "Compare queries & keys",
              "Mix value vectors",
              "Combine heads",
              "Encode → decode",
            ].map((x, i) => (
              <p key={x}>
                <b>0{i + 1}</b>
                {x}
              </p>
            ))}
          </div>
          <small>Use the check below to complete this module.</small>
        </div>
      );
  }
}
