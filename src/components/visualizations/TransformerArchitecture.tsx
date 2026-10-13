import { useState } from "react";
const details: Record<string, string> = {
  "Input embedding":
    "Each input token becomes a vector. Position signals are added before the encoder.",
  "Self-attention":
    "Every input token can gather information from every other input token.",
  "Add & Norm":
    "A residual connection adds the sublayer input to its output, followed by layer normalization.",
  "Feed-forward":
    "The same small neural network transforms each position independently.",
  "Masked attention":
    "The decoder sees current and earlier output positions. Future positions are blocked.",
  "Cross-attention":
    "Decoder queries attend to keys and values from the encoder output.",
  "Linear → Softmax":
    "The decoder output is projected to vocabulary scores and normalized to predict the next token.",
  "Output embedding":
    "Previously generated output tokens are shifted right, embedded, and given position signals.",
};
export function TransformerArchitecture({ phase }: { phase: number }) {
  const [selected, setSelected] = useState("Self-attention");
  return (
    <>
      <div className="viz-toolbar">
        <span>
          <i className="green-dot" /> THE ORIGINAL TRANSFORMER
        </span>
        <span>Encoder + Decoder</span>
      </div>
      <div className={"architecture " + (phase ? "flowing" : "")}>
        <div className="tower">
          <span className="tower-label">
            ENCODER <small>× 6 layers *</small>
          </span>
          {[
            "Add & Norm",
            "Feed-forward",
            "Add & Norm",
            "Self-attention",
            "Input embedding",
          ].map((name, i) => (
            <button
              key={i}
              aria-pressed={selected === name}
              onClick={() => setSelected(name)}
              className={selected === name ? "layer chosen" : "layer"}
            >
              {name}
            </button>
          ))}
          <span className="flow-label">↑ Input tokens</span>
        </div>
        <div className="cross-arrow">
          →<small>context</small>
        </div>
        <div className="tower">
          <span className="flow-label">Next-token probabilities ↑</span>
          {[
            "Linear → Softmax",
            "Add & Norm",
            "Feed-forward",
            "Add & Norm",
            "Cross-attention",
            "Add & Norm",
            "Masked attention",
            "Output embedding",
          ].map((name, i) => (
            <button
              key={i}
              aria-pressed={selected === name}
              onClick={() => setSelected(name)}
              className={selected === name ? "layer chosen" : "layer"}
            >
              {name}
            </button>
          ))}
          <span className="tower-label">
            DECODER <small>× 6 layers *</small>
          </span>
        </div>
      </div>
      <div className="layer-detail" role="status">
        <strong>{selected}</strong>
        <p>{details[selected]}</p>
      </div>
      <p className="viz-note">
        Simplified diagram. *Attention and feed-forward blocks repeat six times;
        embeddings and the output projection run once. Position signals are
        added to both embeddings.
      </p>
    </>
  );
}
