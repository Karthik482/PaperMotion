import { z } from "zod";
import { computedExample } from "../scenes/output";
import { sceneSchema, validateScene } from "../scenes/schemas";
import { sceneProfiles } from "../scenes/profiles";
export const topicInputSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, "Enter a topic with at least 3 characters.")
    .max(240, "Keep the topic under 240 characters."),
  level: z.enum(["beginner", "technical"]).default("beginner"),
  engineVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(3),
});
export const topicTemplates = [
  "none",
  "architecture",
  "attention",
  "multihead",
  "position",
  "decoder",
] as const;
export const topicPlanSchema = z.object({
  title: z.string().min(1).max(160),
  overview: z.string().min(1),
  domain: z.string().min(1),
  prerequisites: z.array(z.string().min(1)).max(6),
  objectives: z.array(z.string().min(1)).min(2).max(6),
  steps: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        dependsOn: z.array(z.string()),
        beginner: z.string().min(1),
        technical: z.string().min(1),
        example: z.string().min(1),
        misconception: z.string().min(1),
        experience: z.object({
          intent: z
            .object({
              objective: z.string().min(1).max(600),
              conceptType: z.string().min(1).max(120),
              family: z.enum([
                "mathematical",
                "mechanism",
                "data",
                "network",
                "timeline",
                "spatial",
                "economic",
                "annotation",
              ]),
              manipulation: z.string().min(1).max(600),
              outcome: z.string().min(1).max(600),
              fidelity: z.enum([
                "exact",
                "approximate",
                "illustrative",
                "source-backed",
              ]),
            })
            .strict()
            .nullable()
            .optional(),
          templateId: z.enum(topicTemplates),
          rationale: z.string().min(1),
          suggestedInteraction: z.string().min(1),
          scene: sceneSchema.nullable().optional(),
        }),
        check: z.object({
          question: z.string().min(1),
          options: z.array(z.string().min(1)).min(2).max(4),
          answer: z.number().int().nonnegative(),
          feedback: z.string().min(1),
        }),
      }),
    )
    .min(3)
    .max(7),
  limitations: z.array(z.string()).max(8),
});
export type TopicPlan = z.infer<typeof topicPlanSchema>;
export type TopicStep = TopicPlan["steps"][number];
export type TopicRecord = {
  id: string;
  topic: string;
  createdAt: string;
  model: string;
  version: 1 | 2 | 3;
  level?: "beginner" | "technical";
  plan: TopicPlan;
  reference?: boolean;
};
export type TopicSummary = {
  id: string;
  topic: string;
  title: string;
  domain: string;
  stepCount: number;
  createdAt: string;
  level?: "beginner" | "technical";
  version?: 1 | 2 | 3;
};
export function validateTopicPlan(input: unknown, topic: string): TopicPlan {
  const plan = topicPlanSchema.parse(input);
  const seen = new Set<string>();
  const transformerTopic =
    /\btransformers?\b|self[- ]attention|multi[- ]head attention|scaled dot[- ]product attention|positional encod|causal mask/i.test(
      topic,
    );
  for (const step of plan.steps) {
    if (seen.has(step.id)) throw new Error("Duplicate step ID");
    if (step.dependsOn.some((id) => !seen.has(id)))
      throw new Error("Prerequisites must refer to earlier steps");
    if (step.check.answer >= step.check.options.length)
      throw new Error("Invalid quiz answer");
    if (new Set(step.check.options).size !== step.check.options.length)
      throw new Error("Quiz options must be distinct");
    if (step.experience.templateId !== "none" && !transformerTopic)
      throw new Error(
        "Transformer templates cannot be attached to unrelated topics",
      );
    if (step.experience.scene) validateScene(step.experience.scene);
    seen.add(step.id);
  }
  return plan;
}

export const interactivePlanSchema = topicPlanSchema.extend({
  steps: z
    .array(
      topicPlanSchema.shape.steps.element.extend({
        experience: topicPlanSchema.shape.steps.element.shape.experience.extend(
          { scene: sceneSchema },
        ),
      }),
    )
    .min(3)
    .max(7),
});
export function validateInteractivePlan(
  input: unknown,
  topic: string,
): TopicPlan {
  const plan = interactivePlanSchema.parse(input);
  validateTopicPlan(plan, topic);
  if (plan.steps.some((s) => s.experience.templateId !== "none"))
    throw new Error("Interactive scenes must use the universal registry");
  for (const step of plan.steps) {
    const example = computedExample(step.experience.scene);
    if (example) step.example = example;
  }
  return plan;
}
export const universalPlanSchema = interactivePlanSchema
  .extend({
    steps: z
      .array(
        interactivePlanSchema.shape.steps.element
          .extend({
            experience: z.union(
              sceneSchema.options.map((option) => {
                const profile = sceneProfiles[option.shape.type.value];
                return interactivePlanSchema.shape.steps.element.shape.experience
                  .extend({
                    scene: option,
                    intent:
                      topicPlanSchema.shape.steps.element.shape.experience.shape.intent
                        .unwrap()
                        .unwrap()
                        .extend({
                          family: z.enum(
                            profile.families as [
                              (typeof profile.families)[number],
                              ...(typeof profile.families)[number][],
                            ],
                          ),
                          fidelity: z.literal(profile.fidelity),
                        }),
                  })
                  .strict();
              }),
            ),
          })
          .strict(),
      )
      .min(3)
      .max(7),
  })
  .strict();
export function validateUniversalPlan(input: unknown, topic: string) {
  if (JSON.stringify(input).length > 120000)
    throw new Error("Lesson specification exceeds its size limit");
  const parsed = universalPlanSchema.parse(input);
  for (const step of parsed.steps) {
    const profile = sceneProfiles[step.experience.scene.type],
      intent = step.experience.intent;
    if (
      !profile.families.includes(intent.family) ||
      profile.fidelity !== intent.fidelity
    )
      throw new Error(
        "Scene intent does not match the supported family or model fidelity",
      );
  }
  return validateInteractivePlan(parsed, topic);
}
