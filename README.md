# PaperMotion

Phase 4 adds a contextual visual tutor and guided Watch timelines. Open a reference lesson, choose **Watch** or **Explore**, and ask a question in the right rail. AI proposals wait for **Apply to scene**; calculations and playback run locally. See [PHASE4.md](PHASE4.md) for architecture, verification, checkpoints and remaining limits.

Phase 3.5 adds a domain-aware engine with 15 trusted scene types, validated local actions, and five reference lessons available on the homepage without an API key. See [PHASE3.5.md](PHASE3.5.md) for capabilities, contracts, sources, verification and limits.

The Phase 3.1 interface adds a fluid learning workspace, contextual explanation rail, larger selectable diagrams and an interactive homepage preview. See [PHASE3.1.md](PHASE3.1.md) for the change report, responsive verification and before/after comparisons.

A local learning application: enter a topic to create an AI learning path, explore the Transformer lab, or learn from a PDF/arXiv paper.

## Run on Windows

Use Node.js 22.13+ or Node.js 24+. In PowerShell in this folder:

```powershell
npm install
npm run dev
```

Open the local URL printed in the terminal, normally http://localhost:3000. If Node was just installed, restart your terminal or VS Code to refresh PATH. For this machine, a temporary alternative is `$env:Path = 'C:/Program Files/nodejs;' + $env:Path`.

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

## Topic-based interactive learning

Enter a topic or question, choose Beginner or Technical, and select **Create learning path**. The server-side planner generates 3–7 structured steps, each with a validated interactive scene. A separate model review must approve the plan before it is saved.

The universal engine supports function plots, gradient descent, projectile motion, harmonic motion, binomial probability, vector transformations, process diagrams, concept maps, task scheduling, supply/demand, DNA replication, audited Apollo timelines, data operations, Cartesian points and layered illustrations. Numerical controls update deterministic calculations; mechanism steps change illustrated structures. Conceptual diagrams cover subjects outside the supported models. Numerical worked examples come from the engine rather than AI arithmetic.

Lessons live at `/learn/[id]`. Explore controls, select concepts, step through, play, replay and reset supported scenes. Current steps, explanation levels, scene controls and completed checks persist in your browser. Export JSON to obtain the lesson specification. Saved plans in `.papermotion/topics/` reopen without an API call. Cache keys include topic, learning level and engine version; existing lesson URLs remain valid. New lessons normally use two billable calls, and failed provider calls can incur charges.

Use the navigation's theme toggle to switch between light and dark mode. The initial theme follows your system; an explicit choice persists across all routes.

See [PHASE3.md](PHASE3.md) for the architecture, scene contracts, equations, assumptions, extension workflow and verification. Model-knowledge lessons are not verified against retrieved sources; paper analysis remains the evidence-backed entry point. No generated JavaScript, HTML or arbitrary expressions execute.

The original lesson lives at `/lessons/transformer` (optional `?module=0` through `5`). Its original controls remain intact; conversational visual actions are available in the universal `/learn/[id]` player.

## Watch, Explore and Ask

Watch drives bounded, validated timelines through the same state and trusted transitions as manual controls. Pause, step, replay and adjust speed without a model request. Reduced motion uses manual frames. Switching modes pauses and preserves the current model; replay restarts the sequence with its current parameters.

Ask sends a compact current context to `/api/tutor`: lesson/scene identity, current parameters, selected elements, computed results, explanation level, bounded conversation and recent verified experiments. The server resolves configurations and evidence itself. It returns a complete validated proposal with deterministic before/after metrics. Apply rechecks the scene revision and state before committing. Changing a control while a reply is pending expires its actions.

Conversations persist per lesson in this browser; recent experiments persist per scene. Clear conversation cancels a pending request and preserves model settings. Source links and exact extracted excerpts appear when available. Analyzed papers have a read-only evidence tutor; concept cards can focus that conversation. No paper simulation is invented.

Set `OPENAI_API_KEY` in `.env.local` and restart the app for real tutoring. Optional tutor-specific key, model, compatible base URL and cost-rate settings are documented in `.env.example`. The default is the official OpenAI Responses API with structured outputs; FreeLLMAPI is not required. Token usage is shown; a cost estimate appears only when both current model rates are configured. Asking may incur provider charges; reopening a lesson, manipulating controls and playing timelines do not call the model.

Run browser checks with `npx playwright test` after installing Chromium with `npx playwright install chromium`. Tests use an explicit local fake provider and isolated data, with no live AI charges. Windows tests run serially because fixtures share local saved records.

## Understand a paper

Open `/papers` (or click Paper library in the Transformer lesson). Upload a text-based PDF or paste an `https://arxiv.org/abs/...` or `/pdf/...` URL. Extraction runs locally, without an API call. It saves title, abstract, page text, stable passages, section candidates, equation candidates, figure captions, original figure-page previews, and reference passages.

To enable AI analysis, copy `.env.example` to `.env.local` and configure:

```dotenv
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4.1-mini
```

Restart the server after configuring the key. `.env.local` is ignored by Git; `.env.example` must remain a blank template. No API key is sent to the browser.

Choose **Analyze paper** to generate core ideas, methodology, findings, limitations, and 3–7 paper-specific concepts with relationships and reading order. Toggle **Beginner / Technical** to switch explanations. Click any citation to open its exact source passage and link to the original PDF page. **Export JSON** downloads the structured result for future lesson generation.

Analysis uses the OpenAI Responses API with [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). The AI selects passage IDs; the server resolves those IDs to exact extracted text and validates all citations, concept counts, relationships, and reading order. A separate AI grounding review must approve the analysis before it is saved. Refusals, malformed results, nonexistent IDs, unsupported claims flagged by review, and incomplete responses are rejected. AI review reduces errors but is not proof of scientific correctness.

Each successful new analysis normally uses **two billable calls**, including the grounding review. Failed calls may still incur provider charges. Automatic SDK retries are disabled. No fake analysis or Transformer-specific fallback is used. Automated tests use a local fake provider or isolated saved fixtures and never call the real API.

## Storage and limits

Papers and validated analyses are saved in the git-ignored `.papermotion/` folder (override with `PAPERMOTION_DATA_DIR`). SHA-256 of the original PDF identifies duplicate uploads and imports. Reopening an analyzed paper, or submitting its Analyze request again, returns its saved result without calling OpenAI—even if the key is removed or the server is restarted. Results do not expire when the model setting changes. Concurrent requests for the same paper are locked to prevent duplicate analysis. Preserve this folder to preserve the library. This is a local single-user prototype, not an authenticated hosted application.

Limits: 20 MB, 100 pages, and 220,000 extracted characters. Request and download streams are bounded. arXiv imports only use a validated arXiv identifier on the fixed arxiv.org host and reject redirects. Password-protected, damaged, and image-only PDFs fail with an explicit message. Long papers are rejected instead of silently truncated.

PDF text, heading detection, and title inference are approximate. Equation candidates are not reconstructed LaTeX. Figure previews show original pages with context; AI analysis currently receives text/captions only and cannot inspect visual plots. OCR, new scientific visualizations, login, and payments are outside the current implementation.

If a server is forcibly terminated during processing, a `.lock` file may remain for that paper. Stop the server, remove only that paper's `.lock` file inside the data directory, then restart; keep its `.json` and `.pdf` files.

## Phase 1: explore the Transformer

- Open all six modules using the sidebar or Previous/Next.
- Self-attention: choose a query word and adjust temperature. Connections, probabilities, and weighted value outputs update. Each distribution sums to 100% (rounded individual labels may differ slightly).
- Play cycles query tokens; Pause stops cycling; Reset restores defaults.
- Multi-head attention: select 1, 2, 4, or 8 heads and compare their probability bars.
- Architecture: select layers to read their roles. Position module: adjust the position slider. Decoder: select a row to inspect the causal mask.
- Answer the knowledge checks for feedback and session progress.

## Design and boundaries

`src/lib/attention.ts` implements stable softmax, scaled dot-product scores, and weighted value sums. The examples use deterministic **toy vectors and projections**, not a trained language model. Temperature is an added teaching control; the paper's attention formula corresponds to T = 1. Increasing the toy head count displays additional fixed projections, rather than retraining a model or maintaining a full model's dimension budget.

`src/data/transformerLesson.ts` provides validated lesson data. `src/lib/lessonSchemas.ts` defines its schema; `VisualizationRegistry.tsx` dispatches to registered components. New lessons can reuse these components without modifying the lesson viewer. Adding a new visualization type requires a schema entry and registry component.

Transformer lesson progress is held in memory and resets on refresh. External Google Fonts are optional; local font fallbacks work offline.

Browser checks run on their own port (3100). On this workspace, use:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:/Papermotion/.playwright'
npm exec playwright test
```

For a fresh checkout, install Chromium first with `npm exec playwright install chromium` (set the same browser path for installation and tests).

Browser tests use `.next-test/` and `.papermotion/browser-tests/` so they do not alter the real library or interfere with its development build. Unit tests cover attention math, lesson schemas, PDF parsing/rendering, arXiv and size validation, exact evidence resolution, citation integrity, the SDK analysis/review pipeline, origin checks, durable storage, and locking.

Topic tests additionally cover normalized caching, ordered prerequisites, valid quiz answers, supported template selection, SDK planning/review, explanation levels, saved progress, and reuse of the actual attention explorer.

Manual live acceptance was also verified using [UMAP](https://arxiv.org/abs/1802.03426): both upload and arXiv import worked, a five-concept analysis passed grounding review, and a subsequent analysis request returned `cached: true`.

Live topic planning was verified with **How does a CPU work?**: five reviewed steps, no unrelated Transformer interactions, and saved reopening without new planning calls.
