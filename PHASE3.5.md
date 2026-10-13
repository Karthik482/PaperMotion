# Phase 3.5 — Engine audit and implementation plan

## Audit

The repository implements eight strict scene types, pure numerical calculations, client-side state persistence, a registry, an AI planner plus independent review, versioned local storage, paper analysis and the original Transformer laboratory. The Phase 3.1 workspace and both themes are functioning. Numerical scenes compute actual results; concept maps and processes only select descriptions. Action handlers are embedded in the player; there is no reusable validated action reducer, spatial view state, playback speed, algorithm trace, scheduler, economic equilibrium or source-backed timeline capability.

PySpark becomes a concept map because the planner's catalog offers no task scheduling or data execution component. Its prompt explicitly falls back to concept/process diagrams when existing mathematical models do not fit. This is a capability gap, not a reason to rewrite the application.

The requested design skills are not available in the installed catalog or skill folders. The existing warm editorial styling remains the design baseline.

## Implementation plan

1. Extend the strict scene union and introduce a serializable, validated action contract, preserving older state and lesson records.
2. Keep existing exact mathematics; add local scheduling, linear equilibrium and fixed DNA mechanism calculations/state transitions.
3. Add bounded relational/algorithm data exploration, network view controls, spatial point exploration and layered authored-shape annotations.
4. Add selectable, comparable historical timelines whose events resolve to an audited source catalog; never accept invented evidence IDs or arbitrary citation URLs.
5. Deliver five built-in reference paths through the same schemas, registry, player and lesson routes used by AI-generated paths. Reference content is inspectable and does not incur model calls.
6. Upgrade the AI planner with per-scene learning/interaction intent and domain-aware capability selection; version new plans separately while retaining saved URLs.
7. Verify numerical results, state actions, malformed configurations, old plans, all reference interactions, responsive rendering, existing features, TypeScript and production build. Document scope and sources.

The supported engine grows by trusted reusable components rather than arbitrary generated code or new visualization frameworks. Phase 4 conversational control is not implemented.

## Implemented architecture

New engine-v3 plans require a learning intent for every scene: objective, concept type, visual family, manipulation, observable outcome and fidelity. The structured-output schema couples each renderer to its allowed families and fidelity. Server validation checks scene bounds, unique IDs, relationships, quiz answers, prerequisite order and a 120,000-character lesson limit; each scene is capped at 32,000 characters. A separate AI review checks relevance and scientific assumptions before saving. Mathematical, scheduler, economic and data-operation examples are computed by the engine.

The registry has 15 trusted React renderers. No generated code, HTML, SVG, SQL or arbitrary expressions execute. All interactive actions remain local. Keys stay server-side. Existing v1/v2 records and URL identifiers remain supported, with distinct v3 cache keys. Existing paper grounding/review, PDF pages, Transformer laboratory, themes, quizzes, exports and progress remain intact.

`sceneActionSchema` is version 1. Each action validates a target and strict payload. `transition(scene,state,input)` returns `{ok,state,feedback}`. Failed actions return the original state unchanged. Supported actions are select, set_parameter, set_step, next_step, previous_step, play, pause, reset, replay, set_speed, compare, change_layer, fit_view and set_view. Parameters are scene-specific and bounded; selection IDs, layers, steps and target capabilities are checked. View zoom is 1–3, pan is ±960 view units, and playback speed is 0.5×, 1× or 2×. Scene state serializes parameters, step, selection, layers, comparison, view, speed and playback. Reopening sanitizes state and always disables autoplay. Reduced motion uses manual stepping.

Computation is independent of rendering. Local scheduling obeys executor-slot capacity and stage barriers, assigns records exactly once, and preserves the final sum across repartitioning. Economic equilibrium solves the configured inverse linear equations, reports infeasible negative intersections, and draws curves within the nonnegative domain. Data traces implement actual filtering, SQL-style left joins including duplicate matches/NULL, and stable bubble-sort comparisons. DNA uses trusted mechanism states and complement pairing. Spatial relationships use Euclidean distance with equal display scales. Shapes, frames and layers remain bounded data. Network/spatial/illustration scenes support pan, zoom and fit; mobile concept maps use an accessible list instead of tiny nodes.

## Five reference lessons

The homepage lists five authored three-step paths. They use the same version-3 schema, registry, contextual player, `/api/topics/[id]`, `/learn/[id]`, knowledge checks and persisted state as generated lessons. They require no model calls; provenance distinguishes authored lessons from AI plans.

| Lesson | Meaningful interaction | Verified result |
| --- | --- | --- |
| Gradient descent | Change learning rate and iteration; replay, inspect stability/overshoot | f(x)=x², x₀=4, η=.2, five updates: loss .0967458816 |
| PySpark execution | Change partitions/executors/slots; step through task waves and stages; inspect records | Four partitions on two slots with 2 s tasks: 4 s; four slots: 2 s. Final sum of 1–24 stays 300 |
| Supply/demand | Shift assumptions, recompute curves/intersection, compare baseline | Baseline Q=40/P=60; demand shift +20 gives Q=50/P=70; inverse supply shift +20 gives Q=30/P=70 |
| DNA replication | Step separation → priming → extension → joining; select complementary bases; toggle enzyme annotations | Two semiconservative duplexes at completion; leading/lagging structures visibly differ |
| Apollo history | Select dated milestones, inspect NASA evidence, compare preparation/Earth-orbit/lunar tracks | Dates and claims resolve only from the audited catalog; elapsed calendar days are calculated |

Sources: [Apache Spark component definitions](https://spark.apache.org/docs/latest/cluster-overview.html), [OpenStax supply/demand framework](https://openstax.org/books/principles-economics-3e/pages/3-1-demand-supply-and-equilibrium-in-markets-for-goods-and-services), [DNA Replication Mechanisms](https://www.ncbi.nlm.nih.gov/books/NBK26850/), and [NASA Apollo missions](https://www.nasa.gov/specials/apollo50th/missions.html). These sources support definitions and authored claims; they do not turn the toy models into measured forecasts.

## Files and extension points

- `src/lib/scenes/extendedSchemas.ts`, `schemas.ts`, `profiles.ts`: bounded scene types, capability descriptions and renderer-specific intent/fidelity.
- `models.ts`, `simulation.ts`, `output.ts`: pure computations, initial/restored state, controls and computed examples.
- `actions.ts`: validated deterministic action contract for future Phase 4 control.
- `src/components/scenes/ExtendedScenes.tsx`, `Viewport.tsx`, `PlayerCore.tsx`, `ScenePlayer.tsx`, `SceneRegistry.tsx`: trusted renderers, shared state/action UI, view controls and dispatch.
- `src/lib/topics/schemas.ts`, `planner.ts`, `references.ts`, `storage.ts`, and `src/app/api/topics/route.ts`: versioned planning/review, authored references and compatibility.
- `TopicHome.tsx`, `TopicReader.tsx`, `src/app/engine.css`: reference discovery, provenance and responsive scene styling using the existing design tokens.
- `tests/engine.test.ts`, `tests/browser/engine.spec.ts`, updated fixtures and topic tests: model correctness, invalid payloads, serialization, generation contracts and actual browser interactions.
- `eslint.config.mjs`, `package.json`, `package-lock.json`: working lint command and dev tooling. No new visualization framework.

To extend a capability, add a strict bounded schema and semantic validation, pure computation/state rules, profile and controls, a trusted renderer/registry entry, and independent model/action/browser acceptance checks. Add catalog-backed source records on the server for new evidence families. Reference lessons are fixtures for the architecture, not a replacement for generation.

## Verification

40 unit tests pass. The full Chromium suite passes all 20 tests, including five reference lessons, new data/spatial/annotation controls, old scene types, actual Transformer interactions, paper citation/page flows, cached topic reopening, progress, reset/replay/pause and reduced motion. TypeScript, lint and the optimized production build pass. Browser screenshots cover all five reference lessons at 1440px and 390px in both themes; wider workspace and 360px mobile checks remain covered by the existing suite. No console errors or page overflow in the accepted reference runs. The first browser pass caught duplicate assumption keys and a narrow homepage heading overflow; both were fixed before the passing run.

Actual screenshots are in ignored `test-results/phase35-*.png`; production inspection artifacts are in ignored `.tools/phase35/`. These are local artifacts rather than repository assets.

Live generation with the configured `gpt-4.1-mini` provider succeeded for “How does PySpark schedule dataset partitions across executors and stages?” The reviewed v3 plan contains five task-scheduler scenes, not unrelated Transformer visuals or generic concept maps. Its local ID is `07ad7ea4c5d5d9ed3c2d14e1be35566ff75f97e90922c07d55c1ece15fc0e66d`. Earlier live attempts were safely rejected for incomplete output or inconsistent intent; no rejected plan was saved. The final schema couples intent to the selected scene to prevent the observed fidelity mismatch.

The optimized production app was also inspected in Chromium: 20 desktop/mobile × light/dark reference captures, zero console errors and no page overflow. The live generated PySpark scene changed calculated parallel capacity when its executor slider moved and displayed running tasks after stepping. A repeat topic request returned `cached: true`. The sanitized inspection summary is `.tools/phase35/verification.json`; no credentials or uploaded paper contents are included in this report.

## Boundaries

This is an extensible local learning prototype, not a complete simulator of every subject or a hosted multi-user service. No authentication, billing or Phase 4 chat was added. Generic lessons remain model knowledge, not independently retrieved research. A review model improves quality but does not prove factual correctness. Invalid, incomplete or rejected plans are not saved and can still incur provider costs.

- Scheduler: toy equal-duration tasks and sequential barriers; no actual Spark runtime, shuffle, skew, network, locality, failure handling or performance forecasts.
- Economics: linear static assumed curves. A positive inverse-supply shift is a contraction, not expanded supply. No financial advice or market prediction.
- Biology: a schematic DNA fork; no molecular dynamics, full enzyme kinetics, medical simulation or accurate anatomy. Primer replacement and ligation share a simplified final stage.
- History: the only audited event catalog currently contains six Apollo milestones. Other history receives an honest illustrative fallback. No generated sources, geographic reconstruction or inferred causal links are treated as evidence.
- Geography/spatial: Cartesian point distances and schematic region selection; no globe, real borders or medical measurements. Coincident/close points may overlap; the selectable list remains available.
- Data: integer numerical rows, filter, left join and bubble sort; no arbitrary SQL/code execution, full query engine or tree algorithm simulator.
- Statistics/science: the existing binomial and idealized mathematical/physical models remain bounded to their documented assumptions; no general statistics or physics engine.

## Exact commands

```powershell
cd C:\Papermotion
npm install
npm run dev
```

Open the URL printed by Next.js, normally http://localhost:3000. The five ready-made paths are on the homepage. New generated paths require your existing `OPENAI_API_KEY` configuration; nothing changes Codex, OpenCode or FreeLLMAPI setup.

```powershell
npm run lint
npm run typecheck
npm test
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:/Papermotion/.playwright'
npx playwright install chromium
npx playwright test --workers=2
npm run build
npm run start
```

For the currently inspected production session use http://127.0.0.1:3001. Browser tests use an isolated build/data directory on port 3100. Keep `.env.local`, uploaded papers and local lesson data out of Git; the existing ignore rules cover them.
