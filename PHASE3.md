# Universal interactive learning engine

PaperMotion turns a topic and a beginner/technical learning level into a saved, validated learning path. Every new step has a trusted interactive scene. Numerical scenes calculate their results locally; subjects outside those models use selectable concept maps or ordered process diagrams. The existing Transformer laboratory and evidence-backed paper analysis remain available.

## Pipeline and trust boundary

`Topic + level → server-side AI planner → validated lesson JSON → accuracy review → saved plan → trusted registry → scene player`

The planner uses OpenAI Responses Structured Outputs with a Zod-generated schema, following [OpenAI's schema guidance](https://developers.openai.com/api/docs/guides/structured-outputs). A lesson contains 3–7 steps, prerequisites, explanations at both levels, misconception corrections and knowledge checks. Each scene has a type, title, description, assumptions and bounded configuration. A second model review must approve the lesson before storage. Invalid scenes, unknown types, invented graph references, duplicate IDs and invalid quizzes fail validation.

The model supplies data, never executable JavaScript, HTML, SVG or arbitrary mathematical expressions. React components and supported formulas are authored in the repository. Keys stay on the server. General-topic explanations use model knowledge rather than retrieved sources; the review is not a guarantee of factual accuracy. Paper analysis continues to provide extracted source evidence.

Numerical worked examples are derived from the deterministic engine before review and when reading cached plans. They use the scene's starting settings, explicitly distinguished from the learner's adjusted controls. This prevents an AI arithmetic mistake from being presented as the simulation's result. Explanatory prose and conceptual examples still require model review.

## Eight scene types

| Type | Computation or interaction | Assumptions |
| --- | --- | --- |
| `function-plot` | Change coefficients, select x; quadratic, sine, exponential or logistic | Trusted formulas only; domain −10 through 10 |
| `gradient-descent` | Change learning rate and initial x; play, step and replay exact gradient updates | Convex scalar quadratic; up to 60 updates; divergence reported |
| `projectile-motion` | Change launch speed, angle, gravity and height; inspect trajectory over time | Constant gravity, no drag, SI units |
| `harmonic-motion` | Change mass, stiffness and amplitude; step through displacement | Undamped ideal spring, closed-form solution, SI units |
| `probability` | Change trials and success probability; select success count | Exact binomial probabilities; independent identical trials |
| `vector-transform` | Change vector components and rotation; compare input and transformed vectors | Configured 2×2 matrix followed by rotation; equal axis scales |
| `process-diagram` | Select, step through and replay named stages | Conceptual ordering, not a physical simulation |
| `concept-map` | Select nodes and inspect labeled incoming/outgoing relationships | Conceptual relationships, not measured causal strengths |

High-frequency sinusoidal curves adapt their sampling density to retain oscillations. Probability outputs normalize to 100%. Gradient descent's worked example `f(x)=x², x₀=4, η=0.2, 5 updates` computes `x=0.31104`, loss `0.0967458816` (displayed as `0.0967`). Sliders rerun the calculations; animation advances the computed state instead of inventing new results.

## Scene specification

```json
{
  "type": "gradient-descent",
  "title": "Find the minimum of x squared",
  "description": "Adjust the learning rate and compare the computed updates.",
  "assumptions": ["One parameter, exact gradient, convex quadratic."],
  "config": {
    "a": 1,
    "b": 0,
    "c": 0,
    "initialX": 4,
    "learningRate": 0.2,
    "iterations": 5
  }
}
```

## Files and interaction contract

| File | Responsibility |
| --- | --- |
| `src/lib/scenes/schemas.ts` | Strict union, bounds, graph integrity and planner capabilities |
| `src/lib/scenes/simulation.ts` | Pure math, initial state, control definitions, state restoration |
| `src/lib/scenes/output.ts` | Computed plot data, metrics and baseline worked examples |
| `src/components/scenes/SceneRegistry.tsx` | Trusted rendering for all eight types |
| `src/components/scenes/ScenePlayer.tsx` | Controls, playback, selection, replay and reset |
| `src/lib/topics/planner.ts` | Structured planning and independent model review |
| `src/components/layout/ThemeToggle.tsx` | Persistent light/dark preference |

Scene state is `{ parameters, step, selected }`. Stored state is scoped to lesson ID, step ID and a configuration signature. Restoration accepts only finite, bounded registered parameters and real node IDs. Current lesson step, explanation level, quiz completion and scene controls survive reloads. Reset restores the configured baseline; Replay preserves changed parameters and returns to the beginning. Playback pauses at the final step. Reduced-motion users have manual stepping instead of autoplay.

Version-2 lesson cache keys include normalized topic, learning level and engine version. Identical requests return saved results without another analysis call. Existing version-1 lesson URLs still load; old noninteractive topic steps receive conceptual diagram fallbacks without regeneration. Saved lessons are stored under `.papermotion/topics/`. Keep that directory to preserve them. Creating a new lesson normally makes two billable model calls; automated tests make none.

Light and dark themes share the warm editorial design, one rust accent and readable plot colors. The theme follows the system initially and remembers an explicit preference. A head script applies the preference before rendering. Both themes cover the homepage, lesson player, Transformer lab, paper library and analysis reader; original PDF pages retain their white paper backgrounds.

## Extending the engine

Add a discriminant and bounded configuration to the scene schema, implement deterministic math where applicable, define controls and restoration rules, register the authored renderer, and describe its supported behavior in the capability catalog. Add independent numerical checks and browser interaction coverage. Do not let a planner invent a renderer or claim unsupported scientific behavior.

## Verification

Validated with 32 unit/integration tests, 12 browser tests, TypeScript and a production Next.js build. Browser checks cover all eight types, computed outputs, playback/reset, state restoration, reduced motion, theme persistence, legacy Transformer interactions and paper evidence features.

Real server-side AI requests generated an optimization lesson and an unrelated historical-source-evaluation lesson. The latter used concept maps and process diagrams without Transformer content. Repeating both topic requests returned cached lessons. Rendered inspection covered six routes at 1440px and 390px in both themes, with no browser-console errors or horizontal overflow. Reports and screenshots are local under `.tools/phase3/`.

Phase 4 conversational tutoring and AI-driven changes to an active visualization are not implemented here.
