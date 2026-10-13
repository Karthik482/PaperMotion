import type { PaperRecord } from "../papers/schemas";
import type { Scene } from "../scenes/schemas";
export function paperTutorScene(paper: PaperRecord): Scene {
  return {
    type: "process-diagram",
    title: "Paper concepts",
    description: "Evidence-backed concept reading order; not a simulation.",
    assumptions: [
      "This paper view explains extracted evidence; no visualization actions are available.",
    ],
    config: {
      nodes: (paper.analysis?.result.concepts || [])
        .slice(0, 7)
        .map((c) => ({
          id: c.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32),
          label: c.name.slice(0, 80),
          description: c.beginner.slice(0, 1000),
        })),
    },
  };
}
