import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/layout/useReducedMotion";
import { tokens } from "@/data/transformerLesson";
import { toyAttention } from "@/lib/attention";
export function AttentionExplorer({
  query,
  setQuery,
  temperature,
  setTemperature,
  head = 0,
  phase,
  playing,
}: {
  query: number;
  setQuery: (q: number) => void;
  temperature: number;
  setTemperature: (t: number) => void;
  head?: number;
  phase: number;
  playing: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (playing && !reducedMotion) svgRef.current?.unpauseAnimations();
    else svgRef.current?.pauseAnimations();
  }, [playing, phase, reducedMotion]);
  const { weights, output } = toyAttention(query, temperature, head);
  return (
    <>
      <div className="viz-toolbar">
        <span>
          <i className="green-dot" /> LIVE ATTENTION
        </span>
        <span>6 tokens · dₖ = 4</span>
      </div>
      <div className="sentence-label">SELECT A QUERY WORD</div>
      <div className="tokens">
        {tokens.map((t, i) => (
          <button
            key={i}
            aria-pressed={query === i}
            onClick={() => setQuery(i)}
            className={query === i ? "selected" : ""}
          >
            {t}
            {query === i && <small>QUERY</small>}
          </button>
        ))}
      </div>
      <div className="attention-graph">
        <svg
          ref={svgRef}
          viewBox="0 0 720 210"
          role="img"
          aria-label={`Attention connections from ${tokens[query]}`}
        >
          <defs>
            <linearGradient id="line">
              <stop stopColor="#ad472e" />
              <stop offset="1" stopColor="#ad472e" />
            </linearGradient>
          </defs>
          {weights.map((w, i) => (
            <g key={i}>
              <path
                d={`M ${60 + query * 120} 18 C ${60 + query * 120} 115, ${60 + i * 120} 80, ${60 + i * 120} 190`}
                fill="none"
                stroke="url(#line)"
                strokeWidth={1 + w * 15}
                opacity={0.2 + w * 0.8}
              />
              {phase > 0 && !reducedMotion && (
                <circle r={3 + w * 5} fill="#ad472e">
                  <animateMotion
                    dur={`${2.4 - w}s`}
                    repeatCount="indefinite"
                    path={`M ${60 + query * 120} 18 C ${60 + query * 120} 115, ${60 + i * 120} 80, ${60 + i * 120} 190`}
                  />
                </circle>
              )}
            </g>
          ))}
          <circle cx={60 + query * 120} cy="18" r="6" fill="#ad472e" />
          {weights.map((w, i) => (
            <circle
              key={i}
              cx={60 + i * 120}
              cy="190"
              r={4 + w * 12}
              fill="#ad472e"
            />
          ))}
        </svg>
      </div>
      <div className="weight-row">
        {weights.map((w, i) => (
          <div key={i}>
            <span>{tokens[i]}</span>
            <strong>
              {(w * 100).toFixed(1)}
              <small>%</small>
            </strong>
            <div className="weight-track">
              <i style={{ width: `${(w * 100).toFixed(4)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="attention-footer">
        <span>Attention distribution</span>
        <strong>
          Σ {(weights.reduce((a, b) => a + b, 0) * 100).toFixed(1)}%
        </strong>
      </div>
      <div className="temperature">
        <div>
          <label htmlFor="temperature">Softmax temperature</label>
          <output>{temperature.toFixed(2)}</output>
        </div>
        <input
          id="temperature"
          type="range"
          min="0.2"
          max="2"
          step="0.05"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
        />
        <div className="range-labels">
          <span>Focused</span>
          <span>Distributed</span>
        </div>
      </div>
      <div className="formula">
        <span>THE MATH BEHIND THE MOTION</span>
        <code>Attention(Q, K, V) = softmax(QKᵀ / (√dₖ · T)) V</code>
        <small>
          Weighted value output: [{output.map((x) => x.toFixed(2)).join(", ")}]
        </small>
      </div>
    </>
  );
}
