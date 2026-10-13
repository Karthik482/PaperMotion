# Phase 4 — Conversational visual tutor

## Verified baseline and audit

The clean checkout is Phase 3.5 commit `9aa5d1e`: 15 strict scene alternatives, deterministic calculations, a validated `transition` reducer, serializable browser state, three-column topic reader, versioned local topic storage, five authored reference paths, server-side OpenAI planning/review, and separately grounded PDF analysis. The 40 existing unit tests and TypeScript pass before edits. No design skills named in the request are installed; the existing warm editorial tokens, typography and layout are reused.

`PlayerCore` currently owns scene state and local playback. `TopicReader` owns lesson navigation and explanation level. Renderers receive state and selection/action callbacks, with selected explanations portaled into the right rail. This is reusable. There is no tutor backend, conversational memory, atomic multi-action commit, stale-response protection or declarative narrated timeline yet. Numerical outputs already calculate locally; biology/history expose changing mechanisms and audited source records. Paper analyses have validated passage IDs and original excerpts, but are not universal simulation lessons.

## Proposed architecture and data flow

1. Keep `PlayerCore` authoritative for scene state. Add a synchronous state/revision reference and validated atomic action batches. A tutor response never creates a second simulation state.
2. Build compact server-derived context: resolve lesson/scene from storage, validate the supplied current state, calculate current/recent experiment outputs, expose capabilities and trustworthy source IDs. Never accept a client-supplied scene definition or source URL.
3. POST a bounded request to `/api/tutor`. A small provider interface uses existing server credentials and OpenAI Responses structured outputs; tests inject a fake provider or an explicitly configured local SDK fixture server.
4. Interpret a question, validate the complete response and action sequence, calculate before/after candidate outputs, and return a proposal. No action runs from partial JSON. Calculated replies use deterministic metric summaries; model prose explains concepts rather than inventing numerical outputs.
5. On Apply, compare lesson ID, scene ID, revision and a canonical state fingerprint. Revalidate/recompute the entire batch in the browser and commit atomically. Manual changes, playback, navigation, cancellation or clearing invalidate pending proposals. Navigation is limited to known steps in the current lesson.
6. Watch timelines consist of bounded captions, durations and trusted actions. Validate every frame and the complete sequence before playback. Watch, Explore and Ask share state; switching mode pauses without resetting. Playback is explicit, cancellable, replayable and manual under reduced motion.

## Schemas, state and sources

Version 1 tutor requests contain target kind/lesson/scene IDs, revision, strict scene state, learning level, mode, message, bounded recent turns and validated recent experiments. Responses contain explanation/clarification, actions, element/source IDs, assumptions, caveats and suggestions. Returned proposals bind to the requested revision/fingerprint and include server-computed metrics. Timelines are bounded to 24 frames, each with up to four actions and 200–2000 ms duration; total duration is at most 30 seconds. Rendering remains trusted React/SVG. Sources resolve from audited catalogs or the current paper's extracted passages. Unsupported legacy controls remain explicit rather than pretending they use universal actions.

## UI and memory

Add an integrated Ask section in the existing contextual rail, with concise transcript entries, suggestions, composer, cancellation/retry, source evidence and action feedback. Use a collapsible stacked panel on mobile; preserve canvas width. Persist bounded conversations per lesson and experiments per scene in browser storage. Clearing is local and cancels requests. Current state is always sent afresh; history is untrusted narrative, not authority. Older conversation text is bounded with a local summary rather than additional model calls.

## Provider and security

Keep model/provider selection outside simulation logic. Use timeouts, cancellation, no autonomous tools/browsing, bounded tokens, one bounded transient retry, strict runtime parsing, same-origin checks, per-session/global rate/concurrency limits, sanitized metadata logs and token/cost estimates when rates are known. Credentials stay on the server. Progress can stream, but action-bearing replies are buffered until fully validated. Local single-user storage and in-memory limits are not authentication or a multi-user deployment architecture.

## Checkpoints and test plan

1. Context, capability manifest, response/proposal contracts and foundational tests; typecheck/unit tests; commit.
2. Provider/orchestrator, secure endpoint, request limits/cancellation/usage/error tests; lint/typecheck/unit tests; commit.
3. Atomic client execution, actual before/after outputs, stale-state rejection; mathematical/scheduler/economic tests; commit.
4. Tutor rail, bounded conversation persistence, suggestions, progress streaming and recovery; desktop/mobile inspection; commit.
5. Declarative Watch timelines, captions/playback/highlights, accessible controls; DNA/Spark/gradient/Apollo tests; commit.
6. Unified mode transitions, bounded navigation and all five shared conversational flows; browser tests; commit.
7. Full regression, six viewport widths/two themes, security/performance/accessibility review, live provider verification and production build; final report and commit.

## Research informing the design

[Claude Motion's official guide](https://support.claude.com/en/articles/17454997-get-started-with-claude-motion) describes editable, content-driven animations; [Anthropic's conversational visuals article](https://claude.com/resources/articles/claude-builds-visuals) describes adjusting a visual during discussion. PaperMotion borrows the principle of synchronized explanation and editable progression, not an SDK or generated executable animation code. [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) inform the bounded response contract; [streaming guidance](https://developers.openai.com/api/docs/guides/streaming-responses) informs the complete-response boundary.

## Initial limits

No public hosting, authentication, billing or Phase 5. Existing geographic/scientific model limits remain. Model knowledge can be wrong; catalog/passage IDs validate evidence identity, not every interpretation. Cancellation stops application execution and aborts the request, but cannot promise that upstream usage is unbilled. A full token-by-token action stream is deliberately not executed. Verification results and commit IDs will be recorded as checkpoints complete.

## Completed implementation and file map

All seven implementation checkpoints are complete. The audit and architecture above describe the baseline and the decisions implemented, rather than remaining work.

| Responsibility | Files |
| --- | --- |
| Strict contracts, capability manifests, numerical outputs and atomic proposals | `src/lib/tutor/{schemas,context,proposal}.ts` |
| Server-owned lesson/paper resolution and evidence | `src/lib/tutor/{resolver,paperScene}.ts` |
| Structured provider, dynamic decoding vocabulary, orchestration and limits | `src/lib/tutor/{provider,providerSchema,service,limits}.ts`, `src/app/api/tutor/route.ts` |
| Authoritative state, revision tracking and declarative playback | `src/components/scenes/{useSceneSession,useWatch,WatchControls,PlayerCore}.tsx` (hooks use `.ts`), `src/lib/tutor/timeline.ts` |
| Conversation, persistence, paper evidence and contextual layout | `src/components/tutor/`, `src/components/topics/TopicReader.tsx`, `src/components/papers/PaperReader.tsx`, `src/app/tutor.css` |
| Regression and provider fixtures | `tests/tutor*.test.ts`, `tests/browser/{tutor,tutorSecurity,watch,papers}.spec.ts`, `tests/helpers/tutorModelServer.ts` |

Watch provides a trusted local walkthrough for all 15 registered scene types. Stored lesson specifications can include a validated optional timeline, and tutor proposals can offer a custom timeline. Playback, stepping, highlights, sliders, reset and Apply all update the same state. Manual exploration stops a walkthrough; switching modes pauses and retains the result. An authored timeline made incompatible by changed parameters falls back to a valid local walkthrough with visible feedback. Reduced motion uses manual frames without autoplay.

Ask sends current state and recent experiments, not a stale snapshot from an earlier turn. Replies contain conceptual explanation, optional trusted actions, source IDs and locally calculated before/after outcomes. Apply is explicit. A changed revision or fingerprint rejects the pending proposal. Navigation can only open a known step in the current lesson and cannot be combined with mutations of its destination. Applied navigation feedback is saved before the old panel unmounts. Reset restores authored starting settings; replay retains parameter choices. Reset after another mutation is rejected so a model cannot silently undo its own proposed change.

The provider's structured-output schema exposes only current capabilities, known elements and sources. DNA strand highlighting reveals the correct extension stage; the server also supplies ordered mechanism stages and historical event IDs. Numerical scene prose avoids model-authored digits; actual computed values appear in deterministic result summaries. Full semantic validation still runs after structured decoding. No response can introduce executable code or a new renderer.

Paper conversations are read-only and grounded in the current analyzed paper. Source buttons reopen the original extracted-evidence dialog, including passage identity and page. Unknown passage IDs, source IDs, cross-paper context and unsupported simulation actions are rejected. The original Transformer route keeps its existing interactions; Ask is integrated into the universal lesson player and paper reader, not retrofitted into that legacy lesson.

## Verification completed on 2026-10-13

| Check | Result |
| --- | --- |
| Unit suite | 55 passed, including all 40 baseline tests |
| Browser suite | 36 passed, including original Transformer, upload/analysis, lesson navigation and scene behavior |
| Lint and TypeScript | Passed |
| Production build | Passed; all existing routes retained and `/api/tutor` added |
| Production browser smoke | Eight routes at desktop 1440 px and mobile 390 px; Watch/Explore interactions passed, no horizontal overflow or browser errors |
| Responsive conversation flows | Five reference lessons at 2560, 1920, 1440, 1280, 768 and 390 px in both themes; 60 screenshots generated |
| Playback/accessibility | Automatic advancement, pause/resume, manual interruption, replay/reset, keyboard frames, reduced motion, focusable transcript and labeled controls verified |
| Recovery/security | Stale proposals, cancellation, clear-history isolation, unsupported actions, provider errors, same-origin checks, oversized requests and evidence validation verified |

Browser tests use an isolated local OpenAI-compatible fixture to exercise the actual SDK, endpoint and UI without spending API credits. This is separate from live verification. Serial browser execution avoids Windows fixture-file rename races; the suite uses a 60-second test budget. Screenshots and diagnostic files remain ignored local artifacts, not repository assets. The final production smoke made no provider requests.

### Live provider verification

Ten live requests were explicitly approved in batches of five, three and two, using the configured `gpt-4.1-mini` provider. Keys stayed on the server and were not printed. Initial responses exposed numeric prose, reset ordering and DNA stage-selection problems; invalid responses were safely rejected and the constraints above were added. The final two approved requests demonstrated the corrected behavior. Valid live results across the five reference topics were:

| Reference topic | Actual validated outcome |
| --- | --- |
| Gradient descent | Learning rate 1.1 with five iterations changed locally calculated loss from 0.0967458816 to 99.0677827584, demonstrating divergence |
| Spark execution | Executor capacity changed from two to three; calculated duration remained four seconds because the wave count did not change |
| Supply and demand | Demand shift changed from zero to twenty; computed equilibrium quantity changed from forty to fifty and price from sixty to seventy |
| DNA replication | Advanced to strand extension (step three) and highlighted the leading strand with an audited mechanism source |
| Apollo chronology | Proposed navigation to the known third lesson step and returned six validated NASA source IDs |

These checks used the real provider and server orchestrator. Full browser Apply/follow-up flows used the fixture; they should not be described as live-provider browser verification. Token usage is returned when available. Estimated cost remains unknown unless both input and output price rates are explicitly configured; no price was invented.

## Performance, security and deployment limits

Manual controls and Watch playback make no model requests. Context, histories, experiments, source excerpts, output tokens, request sizes and animation duration are bounded. Scene state is recalculated locally. Conversations are bounded per lesson and stored locally; pending proposals are not resurrected after reload. Current-state-dependent responses are not cached as if interchangeable.

Separating the compact AI planner schema from the richer stored scene schema reduced the planning JSON schema from 121,117 to 28,627 bytes while retaining validation of optional authored Watch timelines. This preserves existing lesson generation without asking the planner to emit unnecessary animation data.

The endpoint checks origin, bounds request bodies to 48 KB, applies session/global concurrency and rate limits, aborts cancelled/expired work, retries transient provider failures at most once, and logs sanitized metadata. Complete responses are validated before any action becomes applicable; streaming exposes progress rather than partial action execution. Explicit `TUTOR_BASE_URL` configuration is separate from the existing OpenCode/FreeLLMAPI setup. API keys, paper storage, browser fixtures and diagnostic reports remain ignored.

Remaining limitations: this is a local, single-user prototype. Cookie-based in-memory limits are not distributed quotas or authentication; filesystem lesson storage and browser memory are not a multi-user data architecture. Catalog identities and extracted passages ground evidence but do not guarantee every model interpretation. Models do not browse autonomously. Biology is an explanatory mechanism, historical coverage follows the authored catalog, spatial scenes use their existing coordinate model, and calculations are accurate within each stated model rather than universal scientific simulators. Cancellation cannot guarantee zero upstream billing. Papers remain read-only. No hosting, billing, login or Phase 5 was added.

## Run and review

From PowerShell in `C:\Papermotion`, run `npm install` if needed, then `npm run dev`; open the URL printed by Next.js (normally `http://localhost:3000`). The final verified production server is running at `http://127.0.0.1:3001`. To restart it later, run `npm run build`, then `npm run start -- --hostname 127.0.0.1 --port 3001`.

Keep provider credentials only in `.env.local`; `.env.example` documents optional tutor model, provider URL and usage-rate settings. Start with a reference lesson, use Watch and Explore, ask a contextual question, inspect the computed proposal, then Apply. Try a manual slider change before Apply to see stale-state protection. Open an analyzed paper to ask a question and inspect its extracted evidence.

The Git checkpoints are `0161272` (contracts), `458000a` (backend), `4f0e809` (atomic session), `7e830ad` (conversation UI), `6a3319b` (Watch), `0771e47` (unified flows), and the final Phase 4 hardening/verification commit containing this report. Its exact hash is reported in the completion message.
