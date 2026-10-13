import type { Scene } from "../../src/lib/scenes/schemas";
import type { TopicPlan } from "../../src/lib/topics/schemas";
import { topicFixture } from "./topicFixture";

export const sceneFixtures: Scene[] = [
  {
    type: "gradient-descent",
    title: "Find the bottom of a quadratic",
    description:
      "Change the learning rate and follow the computed updates for f(x)=x².",
    assumptions: [
      "One scalar parameter. Exact gradient; this is not neural-network training.",
    ],
    config: { a: 1, b: 0, c: 0, initialX: 4, learningRate: 0.2, iterations: 5 },
  },
  {
    type: "function-plot",
    title: "Explore a function",
    description:
      "Change coefficients and select x to inspect the function value.",
    assumptions: [
      "This illustrative quadratic models a mathematical function, not measured data.",
    ],
    config: {
      function: "quadratic",
      a: 1,
      b: 0,
      c: 0,
      xMin: -5,
      xMax: 5,
      xLabel: "x",
      yLabel: "f(x)",
    },
  },
  {
    type: "projectile-motion",
    title: "Follow an ideal projectile",
    description: "Change the launch speed and angle; inspect the trajectory.",
    assumptions: ["Constant gravity. No drag. SI units."],
    config: { speed: 20, angle: 45, gravity: 9.8, height: 0 },
  },
  {
    type: "harmonic-motion",
    title: "An ideal spring",
    description: "Change mass and spring stiffness to compare oscillations.",
    assumptions: ["Undamped motion; ideal Hookean spring. SI units."],
    config: { mass: 1, stiffness: 4, amplitude: 2, phase: 0, duration: 10 },
  },
  {
    type: "probability",
    title: "Independent coin flips",
    description: "Change the number of trials and probability of success.",
    assumptions: [
      "Independent trials, identical success probability. Exact binomial calculation.",
    ],
    config: { trials: 10, probability: 0.5, successLabel: "Number of heads" },
  },
  {
    type: "vector-transform",
    title: "Transform a vector",
    description: "Change the vector and rotate the transformed output.",
    assumptions: ["A 2D linear map followed by a rotation."],
    config: {
      matrix: { m11: 2, m12: 0, m21: 0, m22: 1 },
      x: 1,
      y: 1,
      angle: 0,
    },
  },
  {
    type: "process-diagram",
    title: "Fetch, decode, execute",
    description: "Follow one conceptual instruction cycle.",
    assumptions: [
      "A sequential conceptual model. Not a CPU timing simulation.",
    ],
    config: {
      nodes: [
        {
          id: "fetch",
          label: "Fetch",
          description: "Read the next instruction from memory.",
        },
        {
          id: "decode",
          label: "Decode",
          description: "Identify the encoded operation and operands.",
        },
        {
          id: "execute",
          label: "Execute",
          description: "Perform the operation.",
        },
      ],
    },
  },
  {
    type: "concept-map",
    title: "Relationships in an argument",
    description: "Select a concept and inspect its relationships.",
    assumptions: [
      "This is a conceptual argument diagram, not a quantitative simulation.",
    ],
    config: {
      nodes: [
        {
          id: "claim",
          label: "Claim",
          description: "A statement that the argument supports.",
        },
        {
          id: "evidence",
          label: "Evidence",
          description: "Observations offered in support of a claim.",
        },
        {
          id: "reasoning",
          label: "Reasoning",
          description: "Connects evidence to the claim.",
        },
      ],
      edges: [
        { from: "evidence", to: "claim", label: "supports" },
        { from: "reasoning", to: "evidence", label: "interprets" },
      ],
    },
  },
];
export function interactiveFixture(): TopicPlan {
  const plan = topicFixture();
  plan.limitations = [
    "Sequential conceptual illustration; this is not a CPU simulator.",
  ];
  plan.steps.forEach((step) => {
    step.experience.scene = sceneFixtures[6];
    step.experience.rationale =
      "Use a conceptual process to inspect the instruction cycle.";
    step.experience.suggestedInteraction =
      "Select a stage or advance through the cycle.";
  });
  return plan;
}
