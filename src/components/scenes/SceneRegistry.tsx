import type { Scene } from "@/lib/scenes/schemas";
import type { SceneState, Point } from "@/lib/scenes/simulation";
import { sceneOutput } from "@/lib/scenes/output";
import { createPortal } from "react-dom";
import { useId } from "react";
import {
  SchedulerScene,
  EconomyScene,
  DnaScene,
  TimelineScene,
  DataScene,
  SpatialScene,
  IllustrationScene,
} from "./ExtendedScenes";
import { Viewport } from "./Viewport";

export type SceneProps = {
  scene: Scene;
  state: SceneState;
  onSelect: (id: string) => void;
  detailsTarget?: HTMLElement | null;
  onAction?: (action: unknown) => void;
};
export function formatNumber(value: number) {
  return Math.abs(value) >= 1e6 ||
    (Math.abs(value) > 0 && Math.abs(value) < 0.0001)
    ? value.toExponential(3)
    : value.toFixed(4).replace(/\.0000$/, "");
}
function Plot({
  points,
  trail,
  marker,
  bars,
  xLabel,
  yLabel,
  equalAxes,
}: {
  points: Point[];
  trail?: Point[];
  marker: Point;
  bars?: boolean;
  xLabel: string;
  yLabel: string;
  equalAxes?: boolean;
}) {
  const all = [...points, ...(trail || []), marker],
    xs = all.map((p) => p.x),
    ys = all.map((p) => p.y);
  let xMin = Math.min(...xs, 0),
    xMax = Math.max(...xs, 0),
    yMin = Math.min(...ys, 0),
    yMax = Math.max(...ys, 0);
  if (xMin === xMax) {
    xMin -= 1;
    xMax += 1;
  }
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  if (equalAxes) {
    const centerX = (xMin + xMax) / 2,
      centerY = (yMin + yMax) / 2;
    const width = Math.max(xMax - xMin, ((yMax - yMin) * 550) / 210);
    const height = (width * 210) / 550;
    xMin = centerX - width / 2;
    xMax = centerX + width / 2;
    yMin = centerY - height / 2;
    yMax = centerY + height / 2;
  }
  const xp = (v: number) => 60 + ((v - xMin) / (xMax - xMin)) * 550,
    yp = (v: number) => 250 - ((v - yMin) / (yMax - yMin)) * 210;
  const line = (pts: Point[]) =>
    pts.map((p) => `${xp(p.x).toFixed(4)},${yp(p.y).toFixed(4)}`).join(" ");
  return (
    <svg
      className="scene-plot"
      viewBox="0 0 640 300"
      role="img"
      aria-label={`${yLabel} versus ${xLabel}. Selected value ${formatNumber(marker.y)} at ${formatNumber(marker.x)}.`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <line
            x1="60"
            x2="610"
            y1={40 + i * 52.5}
            y2={40 + i * 52.5}
            className="scene-grid"
          />
          <text x="52" y={44 + i * 52.5} textAnchor="end">
            {formatNumber(yMax - ((yMax - yMin) * i) / 4)}
          </text>
          <text x={60 + i * 137.5} y="270" textAnchor="middle">
            {formatNumber(xMin + ((xMax - xMin) * i) / 4)}
          </text>
        </g>
      ))}
      <line x1="60" x2="610" y1={yp(0)} y2={yp(0)} className="scene-axis" />
      <line x1={xp(0)} x2={xp(0)} y1="40" y2="250" className="scene-axis" />
      {bars ? (
        points.map((p, i) => (
          <rect
            key={i}
            x={xp(p.x) - Math.min(9, 220 / points.length)}
            y={yp(p.y)}
            width={Math.min(18, 440 / points.length)}
            height={Math.max(0, yp(0) - yp(p.y))}
            className={p.x === marker.x ? "scene-bar selected" : "scene-bar"}
          />
        ))
      ) : (
        <polyline points={line(points)} className="scene-curve" />
      )}
      {trail && <polyline points={line(trail)} className="scene-trail" />}
      {trail &&
        trail.length < 62 &&
        trail.map((p, i) => (
          <circle
            key={i}
            cx={xp(p.x).toFixed(4)}
            cy={yp(p.y).toFixed(4)}
            r="3"
            className="scene-trail-dot"
          />
        ))}
      <circle
        cx={xp(marker.x).toFixed(4)}
        cy={yp(marker.y).toFixed(4)}
        r="6"
        className="scene-marker"
      />
      <text x="335" y="294" textAnchor="middle">
        {xLabel.slice(0, 70)}
      </text>
      <text x="60" y="22">
        {yLabel.slice(0, 70)}
      </text>
    </svg>
  );
}
function NumericalScene({ scene, state }: SceneProps) {
  const output = sceneOutput(scene, state);
  if (!output) return null;
  return (
    <>
      <Plot {...output} equalAxes={scene.type === "vector-transform"} />
      {output.trail && (
        <div className="scene-legend">
          <span>
            Solid:{" "}
            {scene.type === "vector-transform"
              ? "Input vector"
              : "Objective function"}
          </span>
          <span>
            Dashed:{" "}
            {scene.type === "vector-transform"
              ? "Transformed vector"
              : "Computed updates"}
          </span>
        </div>
      )}
      <div className="scene-metrics" aria-live="polite">
        {output.metrics.map((m) => (
          <div key={m.label}>
            <span>{m.label}</span>
            <output aria-label={m.label}>
              {formatNumber(m.value)}
              {m.unit && <small> {m.unit}</small>}
            </output>
          </div>
        ))}
      </div>
      {output.warning && (
        <p role="status" className="research-error">
          {output.warning}
        </p>
      )}
      <div className="scene-formula">{output.formula}</div>
    </>
  );
}
function DiagramScene({
  scene,
  state,
  onSelect,
  detailsTarget,
  onAction,
}: SceneProps) {
  const markerId = useId().replaceAll(":", "");
  if (scene.type !== "concept-map" && scene.type !== "process-diagram")
    return null;
  const nodes = scene.config.nodes;
  const selected =
    scene.type === "process-diagram"
      ? nodes[state.step]
      : nodes.find((n) => n.id === state.selected) || nodes[0];
  const related =
    scene.type === "concept-map"
      ? scene.config.edges.filter(
          (e) => e.from === selected.id || e.to === selected.id,
        )
      : [];
  const root =
    scene.type === "concept-map"
      ? nodes.filter((n) => !scene.config.edges.some((e) => e.to === n.id))
      : [];
  const hasRoot = root.length === 1;
  const others = hasRoot ? nodes.filter((n) => n.id !== root[0].id) : nodes;
  const columns = others.length <= 4 ? 2 : 3;
  const rows = Math.ceil(others.length / columns) + (hasRoot ? 1 : 0);
  // Reserve enough lines even for an 80-character unbroken label.
  const nodeHeight = Math.max(
    84,
    Math.ceil(Math.max(...nodes.map((n) => n.label.length)) / 9) * 27 + 36,
  );
  const rowHeight = nodeHeight + 60;
  const height = rows * rowHeight + 24;
  const position = (id: string) => {
    if (hasRoot && id === root[0].id) return { x: 480, y: rowHeight / 2 };
    const i = others.findIndex((n) => n.id === id);
    return {
      x: (960 / columns) * ((i % columns) + 0.5),
      y:
        rowHeight / 2 +
        rowHeight * (Math.floor(i / columns) + (hasRoot ? 1 : 0)),
    };
  };
  const nodeButton = (n: (typeof nodes)[number], i: number, className = "") => (
    <button
      key={n.id}
      className={className}
      aria-pressed={selected.id === n.id}
      onClick={() => onSelect(n.id)}
    >
      <span>{String(i + 1).padStart(2, "0")}</span>
      <strong>{n.label}</strong>
      {scene.type === "process-diagram" && i < nodes.length - 1 && (
        <span aria-hidden="true">→</span>
      )}
    </button>
  );
  const detail = (
    <div className="scene-node-detail" aria-live="polite">
      <span className="eyebrow">Selected element</span>
      <h3>{selected.label}</h3>
      <p>{selected.description}</p>
      {related.map((e, i) => (
        <p className="scene-relationship" key={i}>
          <strong>{nodes.find((n) => n.id === e.from)!.label}</strong>{" "}
          <span>{e.label}</span>{" "}
          <strong>{nodes.find((n) => n.id === e.to)!.label}</strong>
        </p>
      ))}
    </div>
  );
  return (
    <>
      {scene.type === "concept-map" ? (
        <div className="concept-canvas scene-nodes">
          <p className="scene-interaction-hint">
            Select a concept to explore its connections.
          </p>
          <Viewport
            state={state}
            onAction={onAction}
            height={height}
            label="Interactive concept relationships"
          >
            <defs>
              <marker
                id={markerId}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--line-control)" />
              </marker>
            </defs>
            {scene.config.edges.map((e, i) => {
              const a = position(e.from),
                b = position(e.to),
                dx = b.x - a.x,
                dy = b.y - a.y;
              // Route through row gaps so connectors never obscure another node.
              let route: string;
              if (dy === 0 && Math.abs(dx) <= 960 / columns) {
                const direction = Math.sign(dx);
                route = `M${a.x + direction * 130} ${a.y}H${b.x - direction * 130}`;
              } else if (dy === 0) {
                const gap = a.y + rowHeight / 2;
                route = `M${a.x} ${a.y + nodeHeight / 2}V${gap}H${b.x}V${b.y + nodeHeight / 2}`;
              } else {
                const direction = Math.sign(dy),
                  startGap = a.y + (direction * rowHeight) / 2,
                  endGap = b.y - (direction * rowHeight) / 2;
                const channel = a.x < 480 ? 16 : 944;
                route = `M${a.x} ${a.y + (direction * nodeHeight) / 2}V${startGap}${Math.abs(dy) > rowHeight ? `H${channel}V${endGap}` : ""}H${b.x}V${b.y - (direction * nodeHeight) / 2}`;
              }
              return (
                <path
                  key={i}
                  d={route}
                  fill="none"
                  className={
                    e.from === selected.id || e.to === selected.id
                      ? "concept-edge selected"
                      : "concept-edge"
                  }
                  markerEnd={`url(#${markerId})`}
                >
                  <title>{`${nodes.find((n) => n.id === e.from)!.label} ${e.label} ${nodes.find((n) => n.id === e.to)!.label}`}</title>
                </path>
              );
            })}
            {nodes.map((n, i) => {
              const p = position(n.id);
              return (
                <foreignObject
                  key={n.id}
                  x={p.x - 130}
                  y={p.y - nodeHeight / 2}
                  width="260"
                  height={nodeHeight}
                >
                  {nodeButton(n, i, "graph-node")}
                </foreignObject>
              );
            })}
          </Viewport>
          <div className="mobile-concept-nodes">
            {nodes.map((n, i) => nodeButton(n, i))}
          </div>
        </div>
      ) : (
        <div className="scene-nodes process-nodes">
          <p className="scene-interaction-hint">
            Select a stage or step through the sequence.
          </p>
          {nodes.map((n, i) => nodeButton(n, i))}
        </div>
      )}
      {detailsTarget ? createPortal(detail, detailsTarget) : detail}
    </>
  );
}
// Only these trusted renderers can be selected by a validated scene type.
export const sceneRegistry: Record<
  Scene["type"],
  (props: SceneProps) => React.ReactNode
> = {
  "task-scheduler": SchedulerScene,
  "supply-demand": EconomyScene,
  "dna-replication": DnaScene,
  "historical-timeline": TimelineScene,
  "data-explorer": DataScene,
  "spatial-explorer": SpatialScene,
  "annotated-illustration": IllustrationScene,
  "function-plot": NumericalScene,
  "gradient-descent": NumericalScene,
  "projectile-motion": NumericalScene,
  "harmonic-motion": NumericalScene,
  probability: NumericalScene,
  "vector-transform": NumericalScene,
  "process-diagram": DiagramScene,
  "concept-map": DiagramScene,
};
