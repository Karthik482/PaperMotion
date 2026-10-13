# PaperMotion — Phase 2.5 design audit and proposal

Status: implemented after user approval, in the requested order: homepage, lesson viewer, visualization controls, shared components, responsive polish. The original audit below is retained as the before-state; Section 18 records the completed implementation and verification.

Reviewed October 9, 2026. The existing application was running at http://127.0.0.1:3001. Inspection used the real saved CPU lesson, the analyzed UMAP paper, an extracted optical-tweezer paper, and the six Transformer modules. No topic-generation, paper-analysis, upload, or arXiv-import request was submitted during this audit.

## 1. Skill availability and instructions

| Requested skill | Available as an installed skill? | Actual instructions read? |
| --- | --- | --- |
| UIZZE ui-design | No matching skill found | No; unavailable |
| UIZZE anti-ui-slop | No matching skill found | No; unavailable |
| Impeccable | No matching skill found | No; unavailable |
| Taste Skill | No matching skill found | No; unavailable |
| Emil Design Engineering | No matching skill found | No; unavailable |
| Vercel Web Design Guidelines | No matching installed skill found | Its public guidelines were read separately; this is not an installed-skill invocation |

Checked the session's available-skills catalog, `C:/Users/karth/.codex/skills`, the Codex plugin cache, `C:/Users/karth/.claude/skills`, and the conventional user/project `.agents`, `.codex`, `.claude`, and OpenCode skill locations. Several conventional directories do not exist. None of the requested packages appeared in the locations checked. This is a statement about discoverable session/local skills, not a claim to have searched every directory on the laptop. No substitute was installed or represented as the requested skill.

The audit proceeds from the product brief, source inspection, and rendered evidence. The actual [public Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) were read as a supplementary reference for focus, semantics, state, motion, and content handling. User requirements take precedence, including the explicit approval gate and scope limits. The installed Next.js CSS and font guides were also read at `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` and `13-fonts.md`.

## 2. Audit method and evidence

- Inspected every frontend route wrapper, all layout/lesson/topic/paper/visualization components, the global stylesheet, lesson definitions, capability registry, attention math boundaries, and browser acceptance tests. API route wrappers and README were reviewed to establish preservation requirements.
- Captured the six principal rendered states at 1440 × 1000 and 390 × 844: homepage, Transformer attention lesson, paper library, CPU lesson, analyzed paper, and extracted paper.
- Captured the remaining Transformer modules at 1440px and 390px; checked attention at 768px and 320px; inspected eight heads, paper concepts, and the evidence dialog.
- Exercised word selection, temperature, probability sum, Play/Pause, Reset, head count, positional selection, positional playback/reset, quiz feedback, and citation opening/Escape dismissal. Used disposable browser contexts; existing stored lesson records were not modified.
- Measured viewport overflow, content positions, target dimensions, font loading, and selected color contrasts. Inspected screenshots visually, rather than using successful compilation as a design verdict.

Evidence is in the existing git-ignored `.tools/design-audit/` directory:

- [Primary browser measurements](.tools/design-audit/report.json)
- [Detailed module checks](.tools/design-audit/detail-report.json)
- [Runtime diagnostics](.tools/design-audit/runtime-report.json)
- [Homepage — desktop](.tools/design-audit/home-1440.png), [mobile](.tools/design-audit/home-390.png)
- [Transformer — desktop](.tools/design-audit/transformer-1440.png), [mobile](.tools/design-audit/transformer-390.png)
- [Topic lesson — desktop](.tools/design-audit/topic-1440.png), [mobile](.tools/design-audit/topic-390.png)
- [Paper analysis — desktop](.tools/design-audit/paper-1440.png), [mobile](.tools/design-audit/paper-390.png)

Limitations: Chromium on this Windows machine; not yet Safari, Firefox, physical touch devices, or a screen-reader conformance audit. Measurements apply to these saved records and viewport sizes. Existing input rejection and API correctness were inspected in code/tests, not re-exercised through billable generation. Font readiness was verified separately: the used DM Sans and Manrope weights load. An earlier probe for unused Manrope weight 400 is not evidence of a font failure.

## 3. Routes, layouts, and reusable pieces

| Route | Current layout | Function to preserve |
| --- | --- | --- |
| `/` | `PaperShell` → marketing hero, static CPU preview, topic form, three entry cards, saved paths | Topic input, suggestions, planner status/errors, cached saved paths, paper/lab entry points |
| `/learn/[id]` | `PaperShell` → long lesson overview, step sidebar, stacked text/example/misconception/experience/check panels | Ordered steps, explanation levels, examples, quizzes, browser-local progress, JSON export, registered interactions when relevant |
| `/lessons/transformer` | Fixed sidebar, large paper header, module header, canvas + notes, takeaway, quiz, navigation | All six modules, query/temperature/heads, architecture selection, positional signals, causal mask, playback and feedback |
| `/lessons/transformer?module=0…5` | Same viewer with the existing initial-module query parameter | Existing initial-module links, default attention module, valid module bounds |
| `/papers` | `PaperShell` → intro, symmetric PDF/arXiv cards, library rows | Local extraction, validated imports, size limits, saved paper states, original lesson link |
| `/papers/[id]` | `PaperShell` → paper header, view buttons, analysis/concepts/source, evidence modal | Analysis action, reviewed saved results, levels, exact citations, limitations, source warnings, original PDF/pages and JSON export |

Retain API routes unchanged: `/api/topics`, `/api/topics/[id]`, `/api/papers`, `/api/papers/[id]`, `/api/papers/[id]/analyze`, `/api/papers/[id]/pdf`, and `/api/papers/[id]/pages/[page]`.

Reusable components already exist: `PaperShell`, `Sidebar`, `LessonHeader`, `ExplanationPanel`, `KnowledgeCheck`, `VisualizationRegistry`, and the three separate visualization components. Positions, causal mask, and recap are embedded inside the registry. Topic/paper readers duplicate explanation switches, loading/error states, headers, actions, and footer patterns. There is no shared button, field, segmented-control, notice, or reading-layout contract.

Current tokens: `--bg`, `--paper`, `--ink`, `--muted`, `--green`, `--line`, `--soft`. Most styles bypass them with literal colors and sizes. `globals.css` has ten very long lines covering several generations of styling. Broad `main`, `nav`, and `h1` selectors create cross-page coupling; breakpoints differ across shells. The same `eyebrow` rule is redefined later. Component source is also compressed, making state and visual review unnecessarily difficult.

## 4. Findings, in priority order

### P0 — Lesson interaction contracts and reading accessibility

1. **Existing playback/reset mismatch.** In `VisualizationRegistry.tsx:6`, Positions owns its own position state; the shared controls in `LessonViewer.tsx` do not control it. Measured: position changes to 15, Play leaves the displayed position unchanged, Reset leaves it at 15. Decoder similarly owns selection separately, and recap has no animation. A uniform Play button implies capabilities these views do not implement. Architecture playback pulses the chosen layer rather than explaining a processing sequence. These are existing defects/limitations to address explicitly after approval; do not invent new animations to mask them.
2. **Positional encoding hydration warning.** Directly opening `?module=3` produces a React hydration diagnostic. The SVG `points` differ at tiny decimal precision between server and browser, e.g. `4.079933355551587` versus `4.079933355551589`. The plotted shape still renders. Presentation-coordinate serialization should be deterministic; do not change the underlying sinusoidal mathematics or suppress the warning blindly.
3. **Important teaching disappears responsively.** `.explainer` becomes `display:none` below 950px. This removes the contextual explanation, Try This instructions, and the crucial temperature/toy-model qualification, rather than relocating them. At 768px and 390px the notes are absent.
4. **Small, low-contrast instructional text.** Labels commonly use 6–11px; body copy frequently uses 11–14px. The palette has too many pale sage foregrounds. Calculated examples: homepage copy `#819176` on `#f8f9f5` ≈ 3.18:1; explorer copy `#808b73` on `#f1f4ea` ≈ 3.22:1; form metadata `#a0ad90` on white ≈ 2.37:1. These normal-sized text pairs fall below the 4.5:1 contrast threshold in [WCAG's contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
5. **Incomplete semantics.** `PaperShell.tsx:4` uses a content `div`, so topic and paper pages lack a main landmark. No shell has a skip link. `PaperReader.tsx` opens a native dialog with working Escape dismissal, but it has no accessible name via `aria-labelledby` or `aria-label`. Quiz choices and architecture selection communicate selection primarily through styling, unlike token/level controls that already expose `aria-pressed`.
6. **Motion preference is only partially handled.** The CSS reduced-motion rule disables CSS animation/transitions. It does not govern SVG SMIL or the React cycling timer. Measured under reduced motion after pressing Play: SVG time continues advancing. Use an explicit reduced-motion presentation and manual stepping, rather than assuming the CSS rule covers the visualization.

### P1 — Homepage hierarchy and identity

7. **The main action sits behind a marketing sequence.** At 1440px, the topic-entry container begins at y=646; at 390px, y=914, beyond the 844px viewport. The hero and noninteractive CPU preview precede the thing users came to do. The preview cannot be manipulated and does not demonstrate the available Transformer interactions.
8. **Generic template structure.** Slogan → benefits → rotated nested-card preview → form card → three equal feature cards → saved-card list resembles a SaaS landing page. Decorative sparkle marks, icon tiles, tiny uppercase captions, a tinted headline, and a future-feature card compete with actual learning. Existing styles are already light and avoid pervasive glassmorphism; those are strengths, not problems to invent.
9. **Mobile library rows collapse the title column.** The saved CPU title becomes a very narrow, tall stack alongside icon/status/arrow. A wrapped row is not enough: the title needs a full-width reading line and the status needs its own metadata row.
10. **Product internals dominate secondary copy.** References to API keys, schema versions, the model name, and Phase 3 appear in ordinary learning surfaces. Keep configuration errors actionable and privacy/source status visible, but move technical export/provenance detail to a disclosure. Never hide the difference between a source-backed paper analysis and an unverified topic lesson.

### P1 — Lesson viewer hierarchy

11. **The experiment arrives too late.** The default attention canvas starts at y=521 on desktop and y=597 on mobile, after two levels of introduction. Controls and explanatory math extend below the first viewport. In the saved CPU lesson the first step starts at y=959 on mobile; the long overview and navigation panel take the entire opening screen.
12. **Three disconnected learning frames.** Transformer modules, generated topic steps, and paper concepts use different framing/navigation. Topic lessons feel like a stack of chatbot answer cards; paper analysis feels like a report inside repeated boxes. Shared framing should establish one product while retaining each content type's honest capabilities.
13. **Too many equal containers.** Explanation, worked example, misconception, unavailable experiment, takeaway, and check each receive similar borders, backgrounds, padding, and radii. The learner cannot easily tell what is the core idea, what to manipulate, and what to verify.
14. **Unavailable experiences take prominent space.** TopicReader renders a large dashed experiment panel with rationale and roadmap language even when `templateId` is `none`. Preserve the suggestion/rationale as a compact disclosure; let the current explanation, worked example, and quiz be the useful experience.
15. **Repeated context and generic prompts.** Paper titles appear in several places. Notes such as “Interact with the diagram” and “Notice what changes” repeat across modules without naming an observable result. Put one module-specific instruction next to the relevant control, reusing existing lesson content rather than generating new tutoring.

### P2 — Precision, navigation, and evidence

16. **Charts lack a consistent labeling system.** Multi-head bars have 7px word labels and percentage values only in hover titles; color drifts from green into purple. Attention has explicit percentages, but its visual and numeric scales need a clearer legend. Head comparisons should use indices, visible values/accessible descriptions, and one accent family. Do not change toy weights or imply trained linguistic roles for heads.
17. **Many targets are short.** Measured navigation links are 16px high, Reset is 17px, export actions are 14px, citation buttons are 22px, and the temperature input's CSS box is 3px. Native thumb behavior and spacing exceptions mean these measurements alone are not a full WCAG failure verdict. They are clear usability risks; design primary targets to 44px and explicitly check the 24px minimum/spacing conditions in [WCAG target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
18. **Navigation lacks orientation.** `PaperShell` does not identify the active top-level destination. Mobile module/step strips clip the next label with no strong indication of which step is current or where the full outline lives. Step changes do not provide a deliberate focus/reading-position transition.
19. **Evidence is available but visually peripheral.** Tiny passage-ID pills, repeated citation rows, and a generic “follow the evidence” side card do not connect a claim and its supporting excerpt clearly. Native modal opening works. The dialog should show human-readable page/section context, retain exact passage IDs, and keep the return path obvious.
20. **Reader length/performance.** All source passages are mounted and displayed in one long list, including a 119-passage saved paper. Figure images are lazy-loaded but lack explicit intrinsic dimensions. The redesign should use a section index and restrained progressive disclosure; consider rendering containment without changing source content or introducing a new virtualized reader engine.
21. **State/copy inconsistencies.** Topic progress persists in localStorage; Transformer progress is session-only. Respect those existing semantics and avoid making identical persistence claims. The global metadata title still says “Understand the Transformer” even for the broader application. Source disclaimers are valuable but currently too faint and scattered.

### What already works

- Inspected principal routes fit 1440px and 390px without page-level horizontal overflow; Transformer also fits 768px and 320px. Local horizontal navigation is still a discoverability issue.
- Word selection and temperature change probabilities; the attention sum reads `Σ 100.0%`. Attention Pause stops token cycling and Reset restores temperature to 1. Eight heads render when selected. The quiz provides explanatory feedback.
- Native buttons, labeled fields/ranges, `aria-pressed` token/level controls, focus-visible styling, and status/alert messages provide a useful starting point.
- Citations resolve to an exact passage, the evidence dialog opens, and Escape closes it. Original PDFs, figure pages, local exports, and saved records are already implemented.
- Primary route checks logged no browser errors. The subsequent direct positional-module check found the specific hydration warning above; “no errors anywhere” would therefore be inaccurate.

## 5. Proposed product personality and original identity

**A working notebook for difficult ideas.** PaperMotion should feel like a carefully typeset research desk with instruments you can use: quiet reading surfaces, precise controls, and immediate connections between a change and its explanation.

Personality: curious, exact, patient, candid. It invites experimentation without suggesting that every AI explanation is verified or every topic has a simulation. It uses the clarity, precision, experimentation, and data literacy in the brief as principles, not borrowed brand assets, product layouts, or signatures.

Distinctive elements:

- Warm ivory and graphite, with one rust accent for selection, primary actions, and highlighted data.
- Editorial serif titles, a technical humanist sans for reading/controls, and tabular numeric labels.
- A recurring small rule and numbered margin annotation: `01 · Select a query`, then the action, then its measured result. Numbering communicates sequence; it is not decorative dashboard chrome.
- One open experiment surface, not a collection of nested cards. Supporting text aligns to its grid with subtle rules.
- A simple PaperMotion wordmark with a small abstract paper-fold/trace mark. Explore this as a code-native vector after approval; no generated glow artwork or new icon system is needed.

Home copy proposal: **“What would you like to understand?”** followed by the input and concrete entry options. Supporting copy: “Build a learning path from a topic, read a paper with its evidence, or explore the Transformer.” Label topic lessons as explanations + checks; label the existing Transformer as interactive. Avoid broad promises of simulations for arbitrary subjects.

## 6. Typography and type scale

Proposed families: **Newsreader** for editorial display/paper titles; **IBM Plex Sans** for body text, navigation, and controls. Both have official OFL font metadata: [Newsreader](https://github.com/google/fonts/blob/main/ofl/newsreader/METADATA.pb), [IBM Plex Sans](https://github.com/google/fonts/blob/main/ofl/ibmplexsans/METADATA.pb). Use the system monospace stack for IDs/code and a math-capable serif fallback for equations; no third branded font is required.

Self-host the selected subsets/weights with the installed Next.js font facilities after approval. Preserve licenses; remove the external CSS font import only during implementation. Font-blocked/offline screenshots must remain readable. No font assets or dependencies are added during this audit.

| Role | Desktop size / line height | Mobile size / line height | Face / weight |
| --- | --- | --- | --- |
| Home display | 48 / 54 | 36 / 41 | Newsreader 500 |
| Paper or lesson title | 34 / 41 | 28 / 34 | Newsreader 500 |
| Active step title | 28 / 34 | 24 / 30 | Plex Sans 600 |
| Section title | 22 / 28 | 20 / 26 | Plex Sans 600 |
| Reading text | 17 / 28 | 16 / 26 | Plex Sans 400 |
| Control/navigation | 14 / 20 | 14 / 20 | Plex Sans 500 |
| Metadata/annotation | 12 / 18 | 12 / 18 | Plex Sans 400–500 |
| Data/readout | 14 / 20 | 14 / 20 | Tabular numerals; monospace where useful |

Use rem values, optical sizing for the serif, comfortable heading wrapping, and restrained letter spacing. Sentence case is the default. Uppercase is limited to a few short category labels at readable sizes. Body lines should usually be 55–72 characters; long paper titles wrap naturally rather than shrinking. Scientific expressions never get scaled into illegibility to fit a phone.

## 7. Color tokens

These replace the scattered sage literals; values are proposed, not installed.

| Token | Value | Purpose |
| --- | --- | --- |
| `--surface-page` | `#F8F6F1` | Warm neutral page |
| `--surface-sheet` | `#FFFDF8` | Reading/work surface |
| `--surface-canvas` | `#FFFFFF` | Clean visualization field |
| `--surface-subtle` | `#F0EDE6` | Quiet secondary grouping |
| `--text-primary` | `#26241F` | Headings and important data |
| `--text-secondary` | `#625F58` | Body metadata; still readable |
| `--line-subtle` | `#DEDAD2` | Decorative dividers |
| `--line-control` | `#8F8980` | Control boundaries that need recognition |
| `--accent` | `#AD472E` | Rust: action, selection, emphasis |
| `--accent-hover` | `#913821` | Hover/pressed action |
| `--accent-soft` | `#F6E9E1` | Selected backgrounds, not text |
| `--focus` | `#AD472E` | Focus ring with surface offset |
| `--success` | `#2D6A45` | Only semantic correct/saved feedback |
| `--warning` | `#806011` | Only semantic limitations/warnings |
| `--danger` | `#A52A2A` | Only errors/incorrect feedback |

Rust is the single brand accent. Semantic status colors are limited to their actual meanings, accompanied by text/shape, and are not a second decorative palette. Chart series use numbered labels and rust/neutral value distinctions rather than eight arbitrary hues.

Calculated candidate contrasts: rust on white ≈ 5.65:1; rust on ivory ≈ 5.23:1; secondary text on ivory ≈ 5.90:1. Recheck every implemented foreground/background and selected/hover/disabled state; these samples are not a blanket accessibility certification. Decorative dividers may be subtle; actionable control boundaries and meaningful diagram marks need their own contrast review.

## 8. Spacing and layout grid

- Base spacing: 4px. Named steps: 4, 8, 12, 16, 24, 32, 48, 64. Exceptional offsets require a reason, not a new arbitrary token.
- Homepage/library content: maximum 1120px, with 32px desktop gutters and 16–20px phone gutters.
- Learning workbench: maximum 1440px overall; outline rail around 208px, flexible center, contextual explanation around 264px. Gaps 24px. Reading columns cap near 68ch; the existing canvas can use the larger center width.
- Vertical rhythm comes from headings, rules, and paragraphs. Avoid putting a 24px padded card around every semantic unit.
- Radius: 4px controls, 6px significant work surfaces, 8px modal/sheet. Pills are reserved for compact status or genuinely segmented choices. No universal 16–24px rounded-card aesthetic.
- Borders separate zones; shadow is limited to dialogs/drawers or a control that truly floats. No paper texture bitmap, glass blur, radial hero glow, or background ornament.

## 9. Homepage proposal

Make the first screen useful immediately. The topic form belongs in the opening composition, not below a static preview.

```text
PaperMotion                         Explore  Papers  Transformer
----------------------------------------------------------------
What would you like                 Existing interactive example
to understand?                      Self-attention
[ Topic or question             ]   [small excerpt of actual
[ Create learning path          ]    Transformer representation]
CPU · SQL joins · Gradient descent   Select words → compare weights
Topic lessons: explanations/checks   Open the Transformer lab →
----------------------------------------------------------------
Continue learning
01  Saved lesson title              Domain · 5 steps        Open →
----------------------------------------------------------------
Learn from a paper                   PDF / arXiv →
Brief, concrete copy; no equal-weight future-feature card
```

The example must come from the existing registered Transformer component/data, or a labeled static excerpt linking to it. It must not depict a CPU simulation that does not exist. Any reuse is Phase 2.5 composition, not a new visualization engine. Do not autoplay it or generate AI content on page load.

On mobile: header → question/input → suggestions → Continue learning → compact Transformer entry → paper entry. The input is usable before scrolling past a decorative preview. Preserve topic-length validation, busy/error states, and saved-path reopening. Keep a visible field label and an inline character counter; show privacy/data destination plainly without making model configuration the product's pitch.

Returning users should see real saved records with a full-width title and a separate metadata line. Do not add fake progress, fabricated time estimates, usage metrics, testimonials, or paid-product pricing.

## 10. Lesson viewer architecture — highest design priority

The lesson viewer is the acceptance benchmark for the identity. The homepage ships first as requested, but the viewer establishes the shared layout decisions in this proposal and receives the deepest design review.

```text
PaperMotion / Transformer               Original paper   Outline
----------------------------------------------------------------
01 The big picture   |  02 · Self-attention       Beginner/Technical*
02 Self-attention ●  |  Select a word to inspect what it attends to.
03 Multi-head        |--------------------------------------------
04 Position          |  Query: learned          Context/explanation
05 Decoder           |  [The][robot][learned]... linked to selection
06 Check             |  ┌ existing visualization ┐
                     |  │ data + readable labels│  What changed?
Completion           |  └────────────────────────┘  Existing notes
                     |  Weights / sum   Temperature  Play  Reset
                     |--------------------------------------------
                     |  Explanation → worked example → quick check
                     |  Previous                            Next →
```

`*` Explanation levels appear only where beginner/technical content already exists. Do not manufacture a second Transformer explanation mode or add a new AI call to populate it.

Proposed presentational structure, retaining existing controllers:

- `LearningFrame`: route-aware context header, outline slot, learning-content slot, optional evidence/explanation slot.
- `StepHeader`: active module title, short instruction, real completion indicator, existing level switch when supported.
- `ExperimentSurface`: existing registry output, capability-appropriate controls, labels/data readouts, model qualification. Registry IDs and control values remain stable.
- `ReadingSection`: unboxed explanation, worked example differentiated by a margin rule, compact misconception note, check as a clearly interactive question.
- `EvidencePanel`: exact passage context for paper-backed content. Keep native dialog semantics; desktop can use a styled side-oriented dialog and mobile a full-width sheet.

These are view contracts, not a new lesson schema or runtime. `LessonViewer`, `TopicReader`, and `PaperReader` keep fetching, progress, evidence resolution, and selection responsibilities. Their content can be passed to shared presentation components later. Do not rewrite working state management in the name of a visual refactor.

Three honest content modes:

1. **Existing interactive lesson:** stage first, supporting explanation beside/below it. Keep all five existing scientific views and recap; no new simulations.
2. **Topic without a registered visualization:** reading first, with a concrete example and working check. Preserve the proposed experiment/rationale in a concise “Suggested experiment — not available” disclosure. Do not create an empty stage, misleading Play button, or chatbot composer.
3. **Paper analysis:** evidence-led reading and ordered concepts; retain summary, methodology, findings, limitations, relationships, and extracted source. Style the current concept list/relationships; do not replace it with a generated scientific graph in this phase.

Move the long topic overview into an initially concise overview/disclosure; retain the full text. Paper title/authors/year remain reachable but no longer occupy a second hero above every module. Keep the current progress semantics: Transformer session progress, topic browser-local progress. Navigation must retain all steps and existing links, including `?module=` entry behavior.

## 11. Visualization canvas and controls

Use a white, accurately bounded stage, readable annotations, and one intentional data emphasis. No decorative dot grid unless coordinates are part of the lesson. Put the instructional prompt directly above tokens/controls. Keep the existing SVG, calculations, probability normalization, and toy vectors.

- Attention: align query/source and destination labels consistently; retain numeric percentages and the 100% sum. Thicker paths still mean greater attention, with an explicit short legend. Keep weighted-value output and the formula in a readable technical disclosure. The toy-model and temperature-as-teaching-control qualifications must remain visible/reachable on every width.
- Multi-head: numbered heads, clear panel titles, readable token labels, and accessible values for each bar. Use one accent family plus neutral distinctions. Keep 1/2/4/8 heads and the existing repeated-pattern qualification.
- Architecture: emphasize selected layers with a rule/fill and semantic pressed state; improve the encoder/decoder labels and context connection without altering topology. Remove decorative glow/pulse. If current playback cannot show a meaningful sequence, label the view as manually explorable instead of inventing Phase 3 behavior.
- Position: retain all eight sinusoidal dimensions, slider bounds, and formulas; use deterministic SVG presentation precision. Resolve the existing reset contract separately from math changes. A manual position control is an educational interaction without a fabricated playback sequence.
- Decoder: preserve the causal mask and accessible/current positions; support visible row/column labels and selected-state text. Do not imply that global playback currently drives its internal row selection.

Control styling: labeled values; 44px comfortable hit areas; ranges keep a slim visual track inside a larger interaction area; native select remains usable. Keyboard input updates immediately. Show focus, pressed, disabled, error, and busy states deliberately. Place Play/Pause and Reset beside the data they govern. Controls appear according to existing capability, rather than automatically showing Play on recap/static views.

## 12. Motion principles

Motion should reveal a changed relationship or preserve orientation, never add perceived sophistication by itself.

| Event | Proposed behavior | Timing |
| --- | --- | --- |
| Hover/focus/press | Color/border feedback; no lift or wobble | 100–140ms |
| Select word / change weight | Immediate data update; short emphasis transition if helpful | Up to 160ms |
| Change lesson step | Immediate content; optional quiet opacity transition | 120–160ms |
| Evidence open/close | Small translation + opacity, interrupted on dismissal | 160–200ms |
| Existing attention Play | Continue current token exploration; visibly tied to selected query | Preserve current behavior pending explicit control-bug approval |
| Reduced motion | Static paths/readouts, no traveling dots/pulse; manual controls remain usable | Instant |

Do not animate slider layout, progress changes continuously, large text entrances, or whole-page transitions. Prefer opacity/transform for interface transitions; chart geometry may change only when it represents changing data. Avoid spring/bounce behavior. Stop timers on unmount and respect Pause and explicit reduced-motion treatment. Do not add a motion library for these modest requirements.

## 13. Responsive behavior

- **1200px and up:** outline, substantial stage/reading column, contextual explanation. The stage is the strongest visual element. No duplicated full-width lesson hero.
- **768–1199px:** compact outline + learning column; move explanation below the stage or into an accessible disclosure. Do not hide teaching text.
- **Below 768px:** single column; compact context header; current step and an Outline button that opens the full existing step list. Keep previous/next actions. The full step title remains readable without squeezing it into a tiny scrolling chip.
- **320–430px:** body text stays 16px; touch controls stay comfortable. For the six-token views, align labels/data carefully with a layout-specific minimum size. If a technical formula needs local horizontal scroll, label that region; never create page overflow or reduce text to 7px.
- **200% zoom / reflow:** switch layout by available CSS width; notes, checks, navigation, and evidence remain reachable. Sticky controls must not cover focused content. Safe-area padding applies to any mobile action bar/sheet.

Design targets, to verify after approval: the topic input begins within the first 360px at 390 × 844; the lesson's active task/stage begins within roughly the first 300px, allowing long genuine titles to wrap naturally. These are orientation goals, not fixed-height clipping rules. Mobile library titles use the full row width before metadata and state.

## 14. Accessibility and trust

- Main landmark and skip link in every shell; clear headings and navigation names; native controls before custom ARIA.
- Contrast target: at least 4.5:1 normal text, 3:1 qualifying large text, and suitable non-text contrast for controls/meaningful chart elements. Validate actual rendered states against [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Primary touch targets aim for 44 × 44px; audit smaller citations/links for the 24px minimum and spacing exceptions instead of declaring compliance from size alone. Reference: [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Diagram data has textual/numeric equivalents; selection and correctness never depend only on color. Include semantic selected state on architecture layers/quiz choices without changing automatic feedback behavior.
- Name the evidence dialog, retain Escape/backdrop dismissal and focus restoration, and ensure it scrolls internally at small widths. Give original-PDF links clear destination/page context.
- Async errors remain local, actionable, and announced. Loading states distinguish local extraction, planning, analysis, and saved-content loading without pretending to show numeric progress.
- Preserve visible distinctions: topic explanations are not source verified; paper analysis has a grounding review but can still be wrong; toy Transformer weights are not trained weights; missing simulations are unavailable.
- Long source text and formulas support copying and zoom. Keep exact quotes and passage IDs intact. Source images retain descriptive alt text and get intrinsic dimensions when available.

Do not claim accessibility certification from this audit. Screen-reader, keyboard, zoom, and color-vision checks belong in the implementation review.

## 15. Anti-patterns to reject

No purple/blue AI gradient, glass panels, repeated glowing borders, emoji labeling, decorative sparkle badges, fake metrics, invented charts, or stock AI illustrations. No rotation added to a static card to simulate personality. No identical icon + eyebrow + card compositions across unrelated sections. No nested panel around every paragraph. No roadmap card with equal prominence to a working feature. No autoplay designed merely to make the product feel alive. No chatbot-style composer when the available task is a lesson. No concealed provenance or invented evidence.

## 16. Prioritized implementation plan after approval

The lesson viewer is the **highest design priority**. Implementation nevertheless follows the requested sequence: homepage → lesson viewer → visualization controls → shared components → responsive polish. Establish tokens and the viewer contract on paper now; do not prematurely refactor every shared component before reviewing the key screens.

| Order | Priority | Before → after | Primary files | Acceptance gate |
| --- | --- | --- | --- | --- |
| 1. Homepage | P1 | Slogan/static preview above a boxed form → immediately usable question/input, real saved-learning rows, concrete lab/paper entries | `TopicHome.tsx`; scoped homepage styles | Input visible early on mobile; saved paths/import/lab links work; honest interaction coverage; desktop/mobile screenshot review |
| 2. Lesson viewer | P0, highest design review | Tall context header and repeated card stack → compact learning workbench with stage or reading as the main experience | `LessonViewer.tsx`, `LessonHeader.tsx`, `Sidebar.tsx`, `TopicReader.tsx`; paper reader presentation aligned without generating visuals | Every module/step reachable; no notes disappear; explanations/checks/export/evidence remain; long titles and text-only topics are strong layouts |
| 3. Visualization controls | P0 | Tiny controls and capability-blind Play/Reset → readable, semantic, capability-appropriate controls and data labels | Existing visualization components, registry view adapters, `KnowledgeCheck.tsx` | Query/temperature/head outputs unchanged; all interaction checks pass; address documented positional hydration/reset issues only as approved existing-bug fixes; no new visualization algorithms |
| 4. Shared components | P1 | Duplicated switches/notices/actions and broad global selectors → proven tokens, scoped styles, reusable form/button/notice/reading/evidence patterns | `PaperShell.tsx`, `PaperLibrary.tsx`, `PaperReader.tsx`, `ExplanationPanel.tsx`, shared UI components, `globals.css`, `layout.tsx` | All paper ingestion/analysis/source states retained; main/skip/focus/dialog semantics; site metadata corrected; no route/API changes |
| 5. Responsive polish | P0 release gate | Text shrinks and notes disappear → responsive reflow, outline access, full-width titles, preserved evidence and controls | All affected layouts/styles | 320/390/768/1024/1440px + 200% zoom; no clipped data or controls; keyboard and reduced-motion checks; final side-by-side visual review |

The known control/hydration issues need small behavior/rendering fixes in stage 3, separate from the attention math and schema. If approval covers visual changes only, keep them explicitly documented as unresolved and ask for their narrow follow-up scope; do not silently create new animation behavior.

## 17. Preservation and review gates

Protected contracts:

- All current public/API routes, supported query parameters, IDs, caches, local storage, exports, saved records, and error handling.
- PDF/arXiv bounds, original PDFs/figure-page previews, extracted passages, equation/reference candidates, warnings, grounding review, inferred/stated limitation distinction, and exact citations.
- Server-only API credentials and existing OpenAI integrations. The OpenCode/FreeLLMAPI setup is unrelated to the website's analysis API and must remain separate.
- `attention.ts`, toy vectors/projections, normalized probabilities, registry type dispatch, lesson schemas, capability gating, and module behavior. No model-generated visualizations, generated code execution, follow-up AI tutor, login, payments, or PDF-generation feature.
- All lesson content and current completion semantics; improve its presentation, not its scientific claims.

After each approved stage: run appropriate existing type/functional checks and inspect rendered screenshots. Tests tied to old copy/classes should be updated to assert the preserved behavior; do not delete checks merely because a visual refactor makes their selectors inconvenient. Add targeted regressions for the specific existing reset/hydration issues if fixed. No test suite can substitute for the visual review.

Final validation should include existing unit tests, typecheck, production build, browser acceptance checks, and desktop/mobile screenshots of all principal states. Recheck all six modules, 1/2/4/8 heads, query changes, temperature normalization, Pause/Reset, quizzes, level switches, exact evidence, exports, missing-key/error/loading/empty states, offline font fallback, and repeated saved reopening without new AI generation. API/source behavior can be verified through existing isolated fixtures; do not incur live analysis charges solely to validate CSS.

Visual acceptance rubric: the first viewport makes the next learning action obvious; the canvas/reading task dominates the hierarchy; every instructional label is readable; spacing expresses content structure rather than repeated cards; states are visibly intentional; source/status claims are honest; controls are reachable at mobile widths. The lesson viewer must feel like an instrument for understanding, not a chatbot response in a dashboard shell.

## 18. Implementation and rendered review

Completed October 9, 2026 following the user's approval to implement the redesign.

- Homepage: the question input appears in the first mobile viewport; the static preview uses the existing toy attention calculation, accurately labeled as illustrative. Saved paths are readable notebook rows. The future-feature card and generic hero were removed.
- Lesson viewer: a compact context header, 208px desktop outline, experiment canvas, and ruled instructional notes. The phone outline expands on demand; module descriptions remain in the mobile notes. Topic overviews and unavailable proposed interactions use expandable details. All original lesson content remains available.
- Controls: rust connections and bars, readable percentages, semantic selected answers/layers, meaningful playback for attention and multi-head modules. Reset remounts local diagram state. Positional SVG coordinates are rounded for stable server/client rendering; calculations and attention mathematics are unchanged. Reduced motion uses manual query advancement and removes SVG motion.
- Shared components: PaperMotion fold-and-trace mark, responsive outline, explanation-level switch, reduced-motion hook, self-hosted Newsreader and IBM Plex Sans with OFL license files. One readable global stylesheet replaces the old minified CSS and remote font import. Navigation has active states, pages have main landmarks and skip links, and evidence dialogs have accessible names.
- Responsive polish: phone reflow preserves notes, citations, controls, long titles, and checks. Semantic success/warning/error colors remain separate from the single rust brand accent.

### Verification

The running app was reviewed at http://127.0.0.1:3001, using real saved CPU, UMAP, and optical-tweezer records. Browser tests use isolated fixtures and blank API credentials. No new live topic-planning or paper-analysis request was made for this redesign.

- 23 unit tests pass; TypeScript and the optimized Next.js production build pass.
- 9 browser tests pass, including the existing paper and topic acceptance suites, positional hydration/reset regressions, reduced-motion behavior, and layout checks at 320, 390, 768, 1024, and 1440px.
- Rendered screenshots cover homepage, paper library, saved topic, analyzed paper, extracted source, all six Transformer modules, all head-count choices, concept lists, and source evidence. Source figure previews continue to load through the existing API.
- At 390px the question input starts at approximately 357px, and the Transformer canvas starts at approximately 293px (previously 597px). Notes remain available. Checked pages and modules have no horizontal overflow.
- Final rendered module/evidence inspection reports no browser-console or page errors. Keyboard skip links, native dialog Escape, citation focus return, lesson JSON export, and 200% zoom were checked.
- Reset restores positional encoding and decoder selections. Query, temperature, probability normalization, Play/Pause, head counts, quizzes, level switching, saved progress, citations, caching, and validation remain covered by acceptance checks.

Evidence is stored in ignored `.tools/design-redesign/`; the original `.tools/design-audit/` screenshots are retained for comparison. `report.json` records the multi-width route inspection and `states-report.json` records final module, keyboard, dialog, export, and zoom checks. Screenshots represent the actual running application, not generated mockups.

The six requested external design skills were unavailable in this installation, as documented in Section 1. They have not been claimed as invoked.

The original routes, APIs, integrations, server-only keys, persisted records, mathematical logic, schemas, and lesson completion behavior were preserved. Phase 3 visualization generation remains outside this implementation.
