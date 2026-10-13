import type { TopicStep } from "./schemas";
export const templateCapabilities = {
  architecture: {
    name: "Transformer architecture",
    description: "Original encoder–decoder Transformer with selectable layers.",
    module: 0,
  },
  attention: {
    name: "Self-attention explorer",
    description:
      "A fixed six-token toy sentence with temperature and query controls. Not a trained model.",
    module: 1,
  },
  multihead: {
    name: "Multi-head attention",
    description: "Fixed toy projections with 1, 2, 4 or 8 attention heads.",
    module: 2,
  },
  position: {
    name: "Positional encoding",
    description: "Sinusoidal encodings with an adjustable position.",
    module: 3,
  },
  decoder: {
    name: "Causal attention mask",
    description: "A six-token causal mask with selectable query rows.",
    module: 4,
  },
} satisfies Record<
  Exclude<TopicStep["experience"]["templateId"], "none">,
  { name: string; description: string; module: number }
>;
