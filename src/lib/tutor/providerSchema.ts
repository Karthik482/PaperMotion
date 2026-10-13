import { z } from "zod";
import { replySchema, navigateActionSchema } from "./schemas";
import { sceneActionSchema } from "../scenes/actions";
// Give structured decoding the same finite vocabulary as the active renderer.
// Semantic validation still runs afterwards; this is not a substitute for it.
export function providerReplySchema(context: unknown, question = "") {
  const manifest = z
    .object({
      capabilities: z.object({
        actions: z.array(z.string()),
        highlightable: z.array(z.string()),
        parameters: z.array(z.unknown()),
      }),
      navigation: z.array(z.object({ id: z.string() })).optional(),
      sources: z.array(z.object({ id: z.string() })),
      readOnly: z.boolean().optional(),
    })
    .parse(context);
  const allowedIds = (ids: string[], limit: number) =>
    ids.length
      ? z.array(z.enum(ids as [string, ...string[]])).max(limit)
      : z.array(z.string()).max(0);
  const options: z.ZodType[] = sceneActionSchema.options.filter(
    (option) =>
      manifest.capabilities.actions.includes(option.shape.type.value) &&
      (option.shape.type.value !== "reset" ||
        /\breset\b|start over|starting settings/i.test(question)),
  );
  if (manifest.navigation?.length && !manifest.readOnly)
    options.push(
      navigateActionSchema.extend({
        payload: z
          .object({
            sceneId: z.enum(
              manifest.navigation.map((n) => n.id) as [string, ...string[]],
            ),
          })
          .strict(),
      }),
    );
  const actions = options.length
    ? z
        .array(
          options.length === 1
            ? options[0]
            : z.union(options as [z.ZodType, z.ZodType, ...z.ZodType[]]),
        )
        .max(8)
    : z.array(sceneActionSchema).max(0);
  return replySchema.extend({
    actions,
    elements: allowedIds(manifest.capabilities.highlightable, 8),
    sourceIds: allowedIds(
      manifest.sources.map((s) => s.id),
      6,
    ),
    explanation: manifest.capabilities.parameters.length
      ? replySchema.shape.explanation.regex(
          /^[^\d]*$/,
          "Explain qualitatively; numerical results are appended by the application.",
        )
      : replySchema.shape.explanation,
  });
}
