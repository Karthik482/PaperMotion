import { z } from "zod";
import { replySchema, stateSchema, turnSchema } from "./schemas";
const metric = z
  .object({
    label: z.string().max(160),
    value: z.union([z.number().finite(), z.string().max(4000)]),
    unit: z.string().max(40).optional(),
  })
  .strict();
const source = z
  .object({
    id: z.string().max(80),
    title: z.string().max(300),
    kind: z.enum(["paper", "catalog", "framework"]),
    quote: z.string().max(1200).optional(),
    page: z.number().int().positive().optional(),
    url: z
      .string()
      .max(1000)
      .refine(
        (s) => s.startsWith("https://") || /^\/papers\/[a-f0-9]{64}$/.test(s),
      )
      .optional(),
  })
  .strict();
export const proposalSchema = z
  .object({
    version: z.literal(1),
    lessonId: z.string().regex(/^[a-f0-9]{64}$/),
    sceneId: z.string().max(80),
    revision: z.number().int().nonnegative(),
    baseFingerprint: z.string().max(12000),
    reply: replySchema,
    before: z.array(metric).max(16),
    after: z.array(metric).max(16),
    afterState: stateSchema,
    resultText: z.string().max(10000),
    sources: z.array(source).max(12),
    usage: z
      .object({
        model: z.string().max(120),
        inputTokens: z.number().int().nonnegative(),
        outputTokens: z.number().int().nonnegative(),
        estimatedUsd: z.number().nonnegative().nullable(),
        cached: z.boolean().optional(),
      })
      .strict(),
  })
  .strict();
export async function readTutorStream(
  response: Response,
  onStatus: (s: string) => void,
) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "The tutor request failed.",
    );
  }
  if (!response.body) throw new Error("The tutor returned an empty response.");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    total = 0,
    result;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.length;
      if (total > 120000)
        throw new Error("Tutor response exceeded its size limit.");
      buffer += decoder.decode(part.value, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        if (!line.trim()) continue;
        const packet = JSON.parse(line);
        if (packet.type === "status")
          onStatus(z.string().max(200).parse(packet.text));
        else if (packet.type === "error")
          throw new Error(z.string().max(500).parse(packet.message));
        else if (packet.type === "result") {
          if (result) throw new Error("Duplicate tutor result.");
          result = proposalSchema.parse(packet.proposal);
        } else throw new Error("Unsupported tutor stream event.");
      }
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  if (!result)
    throw new Error(
      "The response ended before a validated answer arrived. Please retry.",
    );
  return result;
}
export const memorySchema = z
  .object({ turns: z.array(turnSchema).max(16), summary: z.string().max(1200) })
  .strict();
export type TutorMemory = z.infer<typeof memorySchema>;
export function appendTurn(
  memory: TutorMemory,
  turn: z.infer<typeof turnSchema>,
): TutorMemory {
  const all = [...memory.turns, turn],
    dropped = all.slice(0, Math.max(0, all.length - 16));
  return {
    turns: all.slice(-16),
    summary: [
      memory.summary,
      ...dropped.map((t) => `${t.role}: ${t.text.slice(0, 250)}`),
    ]
      .filter(Boolean)
      .join("\n")
      .slice(-1200),
  };
}
