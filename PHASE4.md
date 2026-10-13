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
