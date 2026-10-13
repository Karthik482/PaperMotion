import type { Scene } from "./schemas";
type Family =
  | "mathematical"
  | "mechanism"
  | "data"
  | "network"
  | "timeline"
  | "spatial"
  | "economic"
  | "annotation";
type Fidelity = "exact" | "approximate" | "illustrative" | "source-backed";
export const sceneProfiles: Record<
  Scene["type"],
  { families: Family[]; fidelity: Fidelity }
> = {
  "function-plot": { families: ["mathematical"], fidelity: "exact" },
  "gradient-descent": { families: ["mathematical"], fidelity: "exact" },
  "projectile-motion": { families: ["mathematical"], fidelity: "exact" },
  "harmonic-motion": { families: ["mathematical"], fidelity: "exact" },
  probability: { families: ["mathematical", "economic"], fidelity: "exact" },
  "vector-transform": {
    families: ["mathematical", "spatial"],
    fidelity: "exact",
  },
  "process-diagram": {
    families: ["mechanism", "annotation"],
    fidelity: "illustrative",
  },
  "concept-map": {
    families: ["network", "annotation"],
    fidelity: "illustrative",
  },
  "task-scheduler": { families: ["network", "data"], fidelity: "approximate" },
  "supply-demand": { families: ["economic"], fidelity: "approximate" },
  "dna-replication": { families: ["mechanism"], fidelity: "illustrative" },
  "historical-timeline": { families: ["timeline"], fidelity: "source-backed" },
  "data-explorer": { families: ["data"], fidelity: "exact" },
  "spatial-explorer": { families: ["spatial"], fidelity: "illustrative" },
  "annotated-illustration": {
    families: ["annotation", "mechanism"],
    fidelity: "illustrative",
  },
};
