import type { TopicStep } from "../topics/schemas";
import type { Scene } from "./schemas";
// Legacy saved lessons remain readable without another model request.
export function legacyDiagram(step: TopicStep): Scene {
  return {
    type: "concept-map",
    title: step.title,
    description:
      "Explore the explanation, its worked example, and the misconception to watch for.",
    assumptions: [
      "This conceptual diagram is built from the saved lesson text. It does not simulate physical behavior.",
    ],
    config: {
      nodes: [
        {
          id: "idea",
          label: step.title.slice(0, 80),
          description: step.beginner.slice(0, 1200),
        },
        {
          id: "example",
          label: "Worked example",
          description: step.example.slice(0, 1200),
        },
        {
          id: "misconception",
          label: "Common misconception",
          description: step.misconception.slice(0, 1200),
        },
      ],
      edges: [
        { from: "idea", to: "example", label: "illustrated by" },
        { from: "idea", to: "misconception", label: "clarified by correcting" },
      ],
    },
  };
}
