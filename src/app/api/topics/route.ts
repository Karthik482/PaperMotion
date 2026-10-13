import { apiError, PaperError, sameOrigin } from "@/lib/papers/errors";
import { jsonBody } from "@/lib/papers/http";
import { topicInputSchema } from "@/lib/topics/schemas";
import {
  getTopic,
  listTopics,
  topicId,
  saveTopic,
  withTopicLock,
} from "@/lib/topics/storage";
import { planTopic } from "@/lib/topics/planner";
import { referenceSummaries } from "@/lib/topics/references";
export const runtime = "nodejs";
export const maxDuration = 420;
export async function GET() {
  try {
    return Response.json(
      {
        lessons: await listTopics(),
        references: referenceSummaries,
        plannerReady: !!process.env.OPENAI_API_KEY?.trim(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const parsed = topicInputSchema.safeParse(await jsonBody(request));
    if (!parsed.success) throw new PaperError(parsed.error.issues[0].message);
    const { topic, level, engineVersion } = parsed.data,
      id = topicId(topic, level, engineVersion);
    try {
      return Response.json({ lesson: await getTopic(id), cached: true });
    } catch (e) {
      if (!(e instanceof PaperError && e.status === 404)) throw e;
    }
    return await withTopicLock(id, async () => {
      try {
        return Response.json({ lesson: await getTopic(id), cached: true });
      } catch (e) {
        if (!(e instanceof PaperError && e.status === 404)) throw e;
      }
      const lesson = await planTopic(
        topic,
        id,
        level,
        engineVersion === 3 ? 3 : 2,
      );
      await saveTopic(lesson);
      return Response.json({ lesson, cached: false }, { status: 201 });
    });
  } catch (e) {
    return apiError(e);
  }
}
