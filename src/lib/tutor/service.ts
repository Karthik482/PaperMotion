import {
  replySchema,
  tutorRequestSchema,
  fingerprint,
  type TutorRequest,
} from "./schemas";
import type { TutorProposal } from "./proposal";
import { planCandidate } from "./proposal";
import {
  OpenAITutorProvider,
  TutorError,
  type TutorProvider,
} from "./provider";
import { resolveContext } from "./resolver";
export async function tutorAnswer(
  input: unknown,
  signal: AbortSignal,
  provider: TutorProvider = new OpenAITutorProvider(),
  status: (text: string) => void = () => {},
): Promise<TutorProposal> {
  const request: TutorRequest = tutorRequestSchema.parse(input);
  if (signal.aborted)
    throw new TutorError("CANCELLED", "Request cancelled.", 499);
  status("Reading the current scene and calculated results…");
  const context = await resolveContext(request);
  let result;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal.aborted)
      throw new TutorError("CANCELLED", "Request cancelled.", 499);
    status(
      attempt
        ? "Retrying a temporary provider failure…"
        : "Planning an explanation and supported actions…",
    );
    try {
      result = await provider.generate(context.snapshot, request, signal);
      break;
    } catch (e) {
      if (
        attempt === 0 &&
        e instanceof TutorError &&
        e.code === "PROVIDER_UNAVAILABLE"
      )
        continue;
      throw e;
    }
  }
  if (!result)
    throw new TutorError(
      "PROVIDER_UNAVAILABLE",
      "The tutor did not respond.",
      502,
    );
  if (signal.aborted)
    throw new TutorError("CANCELLED", "Request cancelled.", 499);
  status("Validating the complete proposal and computing outcomes…");
  try {
    const candidate = planCandidate(
      context.scene,
      context.state,
      replySchema.parse(result.reply),
      context.sources,
      context.navigation,
      context.readOnly,
    );
    return {
      version: 1,
      lessonId: request.lessonId,
      sceneId: request.sceneId,
      revision: request.revision,
      baseFingerprint: fingerprint(context.state),
      ...candidate,
      sources: context.sources.filter((s) =>
        candidate.reply.sourceIds.includes(s.id),
      ),
      usage: {
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        estimatedUsd: result.estimatedUsd,
      },
    };
  } catch {
    throw new TutorError(
      "INVALID_RESPONSE",
      "The tutor proposed unsupported actions, evidence or numerical claims. Nothing changed; try a more specific question.",
      422,
    );
  }
}
