import type { Scene } from "../../src/lib/scenes/schemas";
const common = {
  title: "Inspect a trusted example",
  description: "A bounded local example",
  assumptions: ["Illustrative educational data"],
};
export const extendedSceneFixtures: Scene[] = [
  {
    ...common,
    type: "data-explorer",
    config: {
      operation: "left-join",
      rows: [
        { id: "a", key: "A", value: 3 },
        { id: "b", key: "B", value: 1 },
      ],
      lookup: [{ id: "right", key: "A", label: "matched" }],
      threshold: 2,
    },
  },
  {
    ...common,
    type: "spatial-explorer",
    config: {
      units: "units",
      points: [
        {
          id: "origin",
          label: "Origin",
          description: "Starting point",
          x: 0,
          y: 0,
        },
        {
          id: "destination",
          label: "Destination",
          description: "Three across, four up",
          x: 3,
          y: 4,
        },
      ],
    },
  },
  {
    ...common,
    type: "annotated-illustration",
    config: {
      regions: [
        {
          id: "a",
          label: "Start",
          description: "Starting structure",
          shape: "rectangle",
          x: 25,
          y: 50,
          width: 20,
          height: 20,
          layer: "structures",
        },
        {
          id: "b",
          label: "Product",
          description: "Ending structure",
          shape: "ellipse",
          x: 75,
          y: 50,
          width: 20,
          height: 20,
          layer: "products",
        },
      ],
      frames: [
        {
          label: "Start",
          note: "Inspect the starting structure",
          visibleIds: ["a"],
        },
        {
          label: "Product",
          note: "Reveal the illustrative product",
          visibleIds: ["a", "b"],
        },
      ],
    },
  },
];
