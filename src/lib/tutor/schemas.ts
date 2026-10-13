import { z } from "zod";
import { sceneActionSchema } from "../scenes/actions";
const id = z.string().min(1).max(80),
  text = z.string().trim().min(1).max(2400);
export const stateSchema = z
  .object({
    parameters: z
      .record(z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/), z.number().finite())
      .refine((p) => Object.keys(p).length <= 16),
    step: z.number().int().min(0).max(1152),
    selected: z.string().max(40).nullable(),
    layers: z.record(z.string().max(32), z.boolean()).optional(),
    comparison: z.boolean().optional(),
    view: z
      .object({
        zoom: z.number().min(1).max(3),
        x: z.number().min(-960).max(960),
        y: z.number().min(-960).max(960),
      })
      .strict()
      .optional(),
    speed: z.union([z.literal(0.5), z.literal(1), z.literal(2)]).optional(),
    playing: z.boolean().optional(),
    highlighted: z.array(z.string().max(40)).max(6).optional(),
  })
  .strict();
export const navigateActionSchema = z
  .object({
    version: z.literal(1),
    type: z.literal("navigate_scene"),
    target: z.literal("lesson"),
    payload: z.object({ sceneId: id }).strict(),
  })
  .strict();
export const tutorActionSchema = z.union([
  sceneActionSchema,
  navigateActionSchema,
]);
export const timelineSchema = z
  .object({
    version: z.literal(1),
    title: z.string().min(1).max(120),
    frames: z
      .array(
        z
          .object({
            caption: z.string().min(1).max(400),
            durationMs: z.number().int().min(200).max(2000),
            actions: z.array(sceneActionSchema).min(1).max(4),
          })
          .strict(),
      )
      .min(1)
      .max(24),
  })
  .strict();
export type WatchTimeline = z.infer<typeof timelineSchema>;
export const replySchema = z
  .object({
    version: z.literal(1),
    explanation: text,
    clarification: z.string().max(400).nullable(),
    actions: z.array(tutorActionSchema).max(8),
    animation: timelineSchema.nullable(),
    elements: z.array(z.string().max(40)).max(8),
    sourceIds: z.array(z.string().max(80)).max(6),
    assumptions: z.array(z.string().max(400)).max(4),
    caveats: z.array(z.string().max(400)).max(4),
    suggestions: z.array(z.string().min(1).max(180)).max(3),
  })
  .strict();
export type TutorReply = z.infer<typeof replySchema>;
export const turnSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    text: z.string().min(1).max(5000),
    sceneId: id,
  })
  .strict();
export const experimentSchema = z
  .object({
    before: stateSchema,
    after: stateSchema,
    actions: z.array(sceneActionSchema).min(1).max(8),
  })
  .strict();
export const tutorRequestSchema = z
  .object({
    version: z.literal(1),
    requestId: z.string().uuid(),
    kind: z.enum(["topic", "paper"]),
    lessonId: z.string().regex(/^[a-f0-9]{64}$/),
    sceneId: id,
    revision: z.number().int().min(0).max(1e9),
    state: stateSchema,
    level: z.enum(["beginner", "technical"]),
    mode: z.enum(["watch", "explore"]),
    message: z.string().trim().min(1).max(1200),
    history: z.array(turnSchema).max(8),
    summary: z.string().max(1200),
    experiments: z.array(experimentSchema).max(3),
  })
  .strict();
export type TutorRequest = z.infer<typeof tutorRequestSchema>;
export type TutorSource = {
  id: string;
  title: string;
  kind: "catalog" | "framework" | "paper";
  url?: string;
  quote?: string;
  page?: number;
};
export function fingerprint(value: unknown): string {
  const canonical = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, val]) => [k, canonical(val)]),
          )
        : v;
  return JSON.stringify(canonical(value));
}
