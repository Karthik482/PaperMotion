import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createTestPdf } from "./helpers/paperFixture";
import { extractPdf } from "../src/lib/papers/extraction";
import { savePaper, paperId } from "../src/lib/papers/storage";
import { initialSceneState } from "../src/lib/scenes/simulation";
import { paperTutorScene } from "../src/lib/tutor/paperScene";
import { resolveContext } from "../src/lib/tutor/resolver";
import { planCandidate } from "../src/lib/tutor/proposal";
import type { PaperRecord } from "../src/lib/papers/schemas";
import type { TutorRequest } from "../src/lib/tutor/schemas";
test("paper tutor resolves exact extracted evidence, isolates concepts and forbids simulation actions", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "pm-tutor-paper-")),
    old = process.env.PAPERMOTION_DATA_DIR;
  process.env.PAPERMOTION_DATA_DIR = directory;
  try {
    const bytes = createTestPdf(),
      extraction = await extractPdf(bytes, "soil.pdf"),
      passage = extraction.passages.find((p) =>
        p.text.includes("Clay retained more water"),
      )!,
      evidence = [
        {
          passageId: passage.id,
          quote:
            "Clay retained more water than sand in this laboratory experiment.",
        },
      ],
      claim = {
        beginner: "Clay held more water.",
        technical: "Clay retention exceeded sand in these samples.",
        evidence,
      };
    const paper: PaperRecord = {
      id: paperId(bytes),
      filename: "soil.pdf",
      createdAt: new Date().toISOString(),
      source: { kind: "upload" },
      extraction,
      analysis: {
        version: 1,
        model: "test",
        createdAt: new Date().toISOString(),
        result: {
          summary: claim,
          coreIdeas: [claim],
          methodology: [claim],
          findings: [claim],
          limitations: [],
          concepts: ["clay", "sand", "retention"].map((id) => ({
            id,
            name: id,
            ...claim,
          })),
          relationships: [],
          readingOrder: ["clay", "sand", "retention"],
          uncertainties: [],
        },
        review: { approved: true, issues: [] },
      },
    };
    await savePaper(paper);
    const request: TutorRequest = {
      version: 1,
      requestId: randomUUID(),
      kind: "paper",
      lessonId: paper.id,
      sceneId: "clay",
      revision: 0,
      state: initialSceneState(paperTutorScene(paper)),
      level: "technical",
      mode: "explore",
      message: "What does this evidence establish?",
      history: [],
      summary: "",
      experiments: [],
    };
    const context = await resolveContext(request);
    assert.equal(context.readOnly, true);
    assert.equal(context.sources[0].id, passage.id);
    assert.equal(context.sources[0].quote, passage.text.slice(0, 1200));
    const reply = {
      version: 1,
      explanation: "Evidence applies to the measured samples.",
      clarification: null,
      actions: [],
      animation: null,
      elements: [],
      sourceIds: [passage.id],
      assumptions: [],
      caveats: [],
      suggestions: [],
    };
    assert.equal(
      planCandidate(
        context.scene,
        context.state,
        reply,
        context.sources,
        [],
        true,
      ).before.length,
      0,
    );
    assert.throws(() =>
      planCandidate(
        context.scene,
        context.state,
        { ...reply, sourceIds: ["fake"] },
        context.sources,
        [],
        true,
      ),
    );
    assert.throws(() =>
      planCandidate(
        context.scene,
        context.state,
        {
          ...reply,
          actions: [
            { version: 1, type: "next_step", target: "scene", payload: {} },
          ],
        },
        context.sources,
        [],
        true,
      ),
    );
    await assert.rejects(resolveContext({ ...request, sceneId: "foreign" }));
  } finally {
    if (old === undefined) delete process.env.PAPERMOTION_DATA_DIR;
    else process.env.PAPERMOTION_DATA_DIR = old;
    await rm(directory, { recursive: true, force: true });
  }
});
