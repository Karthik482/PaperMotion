import { tokens } from "@/data/transformerLesson";
import { toyAttention } from "@/lib/attention";
export function MultiHeadAttention({
  query,
  setQuery,
  heads,
  setHeads,
  temperature,
  phase,
}: {
  query: number;
  setQuery: (i: number) => void;
  heads: number;
  setHeads: (n: number) => void;
  temperature: number;
  phase: number;
}) {
  return (
    <>
      <div className="viz-toolbar">
        <span>
          <i className="green-dot" /> PARALLEL PERSPECTIVES
        </span>
        <label>
          Heads{" "}
          <select
            aria-label="Attention heads"
            value={heads}
            onChange={(e) => setHeads(Number(e.target.value))}
          >
            {[1, 2, 4, 8].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="tokens compact">
        {tokens.map((t, i) => (
          <button
            aria-pressed={query === i}
            className={query === i ? "selected" : ""}
            key={i}
            onClick={() => setQuery(i)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className={"head-grid " + (phase ? "flowing" : "")}>
        {Array.from({ length: heads }, (_, h) => (
          <div className="head-card" key={h}>
            <span>HEAD {h + 1}</span>
            <div className="head-bars">
              {toyAttention(query, temperature, h).weights.map((w, i) => (
                <div key={i} title={`${tokens[i]}: ${(w * 100).toFixed(1)}%`}>
                  <i
                    style={{
                      height: `${(12 + w * 100).toFixed(4)}px`,
                      background: "var(--accent)",
                    }}
                  />
                  <small>{tokens[i]}</small>
                  <span className="head-probability">
                    {(w * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="combine">
        ↓ Concatenate {heads} outputs ↓<strong>Output projection Wᴼ</strong>
      </div>
      <p className="viz-note">
        Illustrative fixed projections; heads in a trained model learn their own
        weights. Some toy patterns repeat.
      </p>
    </>
  );
}
