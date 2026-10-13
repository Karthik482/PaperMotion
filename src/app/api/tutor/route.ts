import { randomUUID } from "node:crypto";
import { sameOrigin } from "@/lib/papers/errors";
import { limitedBody } from "@/lib/papers/http";
import { tutorRequestSchema } from "@/lib/tutor/schemas";
import { tutorAnswer } from "@/lib/tutor/service";
import { TutorError } from "@/lib/tutor/provider";
import { tutorLimits } from "@/lib/tutor/limits";
export const runtime = "nodejs";
export const maxDuration = 100;
export async function POST(request: Request) {
  const started = Date.now();
  let release: (() => void) | undefined;
  try {
    sameOrigin(request);
    if (request.headers.get("sec-fetch-site") === "cross-site")
      throw new TutorError("ORIGIN", "Request origin is not allowed.", 403);
    const body = tutorRequestSchema.parse(
      JSON.parse(
        Buffer.from(await limitedBody(request, 48000)).toString("utf8"),
      ),
    );
    const cookie = request.headers
        .get("cookie")
        ?.match(/(?:^|;\s*)papermotion_tutor=([a-f0-9-]{36})(?:;|$)/)?.[1],
      session = cookie || randomUUID();
    release = tutorLimits.acquire(session);
    const controller = new AbortController(),
      signal = AbortSignal.any([
        request.signal,
        controller.signal,
        AbortSignal.timeout(95000),
      ]),
      encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(streamController) {
        const emit = (item: unknown) => {
          if (!signal.aborted)
            streamController.enqueue(
              encoder.encode(JSON.stringify(item) + "\n"),
            );
        };
        try {
          const result = await tutorAnswer(body, signal, undefined, (text) =>
            emit({ type: "status", text }),
          );
          emit({ type: "result", proposal: result });
          console.info(
            JSON.stringify({
              event: "tutor",
              requestId: body.requestId,
              sceneId: body.sceneId,
              status: "validated",
              durationMs: Date.now() - started,
              ...result.usage,
            }),
          );
        } catch (error) {
          const e =
            error instanceof TutorError
              ? error
              : new TutorError(
                  "INVALID_CONTEXT",
                  "The active lesson or scene state could not be validated. No changes were made.",
                );
          emit({ type: "error", code: e.code, message: e.message });
          console.info(
            JSON.stringify({
              event: "tutor",
              requestId: body.requestId,
              status: e.code,
              durationMs: Date.now() - started,
            }),
          );
        } finally {
          release?.();
          try {
            streamController.close();
          } catch {
            /* Consumer already cancelled. */
          }
        }
      },
      cancel() {
        controller.abort();
        release?.();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Set-Cookie": `papermotion_tutor=${session}; HttpOnly; SameSite=Strict; Path=/api/tutor; Max-Age=86400${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
      },
    });
  } catch (error) {
    release?.();
    const e = error instanceof TutorError ? error : null;
    return Response.json(
      {
        error: e?.message || "Invalid or oversized tutor request.",
        code: e?.code || "INVALID_REQUEST",
      },
      {
        status:
          e?.status ||
          ([403, 413].includes((error as { status?: number }).status || 0)
            ? (error as { status: number }).status
            : 400),
      },
    );
  }
}
