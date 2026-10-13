# Phase 3.1 — Interactive workspace refinement

## Audit and implementation plan

The existing warm surfaces, editorial headings, rust accent and trusted simulations are retained. The requested UIZZE, Impeccable, Taste, Emil Design Engineering and Vercel Web Design Guidelines skills were not found in the available installed skill folders; no use of those skills is claimed.

The page container currently tops out at 1184px, the topic viewer stacks explanation and examples beneath the canvas, and graph labels scale down with a small SVG. The homepage gives its preview a narrow column, suggested topics and supporting text are small, and the saved notebook uses a single long list. These are presentation and layout issues, not reasons to change the lesson engine.

Priority order:

1. **Lesson workspace:** compact learning path, dominant center canvas, readable contextual right rail. At smaller widths the rail moves below the canvas, while the path becomes a collapsible outline on phones. Keep all state and completion behavior.
2. **Diagram presentation:** readable selectable graph nodes, clearer directed connectors, safe long-label wrapping and selected-element explanations in the right rail. Reuse the same selection contract and data; adapt rendering only.
3. **Homepage:** fluid hero, prominent topic entry, larger preview, clearer suggestions and a responsive notebook grid with generous click targets.
4. **Shared polish:** consistent 16px body text, useful secondary text, restrained focus/hover states, legible controls, differentiated warm surfaces and accessible feedback in both themes.
5. **Rendered verification:** compare saved real lessons and all core routes at 2560×1440, 1920×1080, 1440×900, 1280×800, 768×1024 and 390×844 in both themes. Run existing regressions, TypeScript and the production build.

No AI prompts, API integrations, schemas, numerical formulas or saved lesson records need to change. Phase 4 is outside this work.

## Verification and deliverables

The lesson viewer now uses a compact, sticky learning path, a dominant interactive center canvas and a contextual explanation rail. Selected concept/stage details render in that rail through a presentation-only portal; scene state remains owned by the existing player. Under 1200px, the rail moves below the scene. Below 1024px the topic outline collapses to give the canvas a full row. On phones, concept nodes become large selectable rows, with the same selected explanations and directed relationships. The Transformer outline retains its existing breakpoint.

Concept diagrams use wrapped, directly selectable nodes, directional connectors routed through row gaps and enough vertical space for the longest permitted labels. Root concepts are placed above their children when a single root exists. This is a deterministic presentation layout; it does not infer new relationships. The existing schema, numerical functions, controls, registry types, persistence and model integration remain intact.

The homepage has a wider editorial hero, larger topic entry, readable suggestions, a two-column saved notebook on desktop and an interactive attention preview using the existing toy attention calculation. Both themes keep warm surfaces and restrained rust highlights. Navigation, feedback, body text, controls, focus indicators and supporting information receive consistent sizing. Motion stays limited to brief feedback transitions and respects reduced motion.

### Changed files

| File | Change |
| --- | --- |
| `src/components/topics/TopicReader.tsx` | Workspace composition, contextual explanation rail, compact header, native progress indicator |
| `src/components/scenes/ScenePlayer.tsx` | Optional explanation mount target; existing player behavior retained |
| `src/components/scenes/SceneRegistry.tsx` | Responsive selectable graph rendering and contextual selected-element details |
| `src/components/topics/TopicHome.tsx` | Interactive preview and clearer entry-point presentation |
| `src/components/papers/PaperShell.tsx` | Optional page class for scoped layout refinement |
| `src/components/layout/ResponsiveOutline.tsx` | Optional collapse breakpoint; topic paths collapse on tablets as well as phones |
| `src/app/refinement.css` | Fluid containers, responsive workspace, typography, controls and both-theme polish |
| `src/app/layout.tsx` | Import the refinement stylesheet after existing styles |
| `tests/browser/workspace.spec.ts` | New preview, workspace geometry, long-label, selection restoration and responsive checks |
| `tests/browser/scenes.spec.ts` | Select visible scene controls across desktop/mobile renderings |
| `README.md`, `PHASE3.1.md` | Refinement documentation and verification |

### Responsive checks

Rendered six existing routes (homepage, saved PySpark lesson, saved gradient-descent lesson, Transformer lab, paper library and saved paper analysis) at **2560×1440, 1920×1080, 1440×900, 1280×800, 768×1024 and 390×844**, in both light and dark mode. All **72 final route/viewport/theme combinations** reported no console errors or horizontal page overflow. Existing browser regressions also checked widths down to 320px.

The new workspace test confirms that the canvas receives substantially more width than the contextual rail at every desktop breakpoint, explanations move below the canvas on smaller screens, an extreme 80-character label remains readable without overflow, and selecting a concept restores after reload. Collapsing explanations preserves the scene. Home preview word selection updates its computed attention connections in both themes.

At 2560px the measured PySpark canvas grows from **872px to 1372px**, while the explanation rail stays at 360px. At 1920px it grows to 1161px. On standard laptops, some canvas width is deliberately assigned to the contextual rail so explanations and the selected visualization stay visible together.

### Test and build results

- `npm test`: **32 passed**, including simulation equations, normalization, schema integrity, AI SDK planner/reviewer behavior and paper evidence validation.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.4.0.
- `npx playwright test --workers=1`: **14 passed**; final connector rendering also passed the focused workspace tests.
- Lint: this repository has no lint script or ESLint configuration; lint was not claimed or added as part of this UI phase.

No new live AI generation requests were needed. Saved real lessons were used for visual inspection, and existing integration/browser tests verified creation flows, missing-key feedback, saved reopening, quizzes, explanation modes, scene controls and paper workflows. Credentials, provider settings and stored lesson records were not edited.

### Review the screenshots

Open [the comparison page](.tools/phase31/comparison.html) and choose a screen, theme and viewport. It loads matching before/after screenshots. Images and geometry reports are in `.tools/phase31/before/` and `.tools/phase31/after/`; full-height homepage and lesson captures are also included at 1440px and 390px.

- [Before: desktop PySpark](.tools/phase31/before/pyspark-dark-1440.png)
- [After: desktop PySpark](.tools/phase31/after/pyspark-dark-1440.png)
- [After: mobile PySpark, full page](.tools/phase31/after/pyspark-dark-390-full.png)
- [After: desktop homepage](.tools/phase31/after/home-light-1920.png)

### Remaining design limits

Dense graphs can have shared connector channels; selected relationships remain highlighted and written explicitly in the contextual rail. On phones, the concept graph becomes a selectable concept list with relationship details rather than a tiny scaled desktop SVG. No zoom/pan editor or automatic semantic graph-layout engine was added. This phase preserves the eight existing scene types and does not begin Phase 4.
