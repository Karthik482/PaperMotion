import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { topicInputSchema, validateTopicPlan } from "../src/lib/topics/schemas";
import {
  getTopic,
  saveTopic,
  listTopics,
  topicId,
  withTopicLock,
} from "../src/lib/topics/storage";
import { planTopic } from "../src/lib/topics/planner";
import { topicFixture } from "./helpers/topicFixture";
import { interactiveFixture } from "./helpers/sceneFixture";
test("topic inputs validate; identical normalized topics share a cache key", () => {
  assert.equal(topicInputSchema.safeParse({ topic: "a" }).success, false);
  assert.equal(
    topicInputSchema.safeParse({ topic: "x".repeat(241) }).success,
    false,
  );
  assert.equal(
    topicId(" How does a CPU work? "),
    topicId("how does a   cpu work?"),
  );
});
test("plans validate order, uniqueness, quizzes and honest template coverage", () => {
  assert.ok(validateTopicPlan(topicFixture(), "How does a CPU work?"));
  const a = topicFixture();
  a.steps[0].experience.templateId = "attention";
  assert.throws(
    () => validateTopicPlan(a, "How does a CPU work?"),
    /unrelated topics/,
  );
  const b = topicFixture();
  b.steps[0].dependsOn = ["registers"];
  assert.throws(() => validateTopicPlan(b, "CPU"));
  const c = topicFixture();
  c.steps[0].check.answer = 100;
  assert.throws(() => validateTopicPlan(c, "CPU"));
  const d = topicFixture();
  d.steps[2].id = d.steps[0].id;
  assert.throws(() => validateTopicPlan(d, "CPU"));
});
test("saved topic plans survive reopening and concurrent planners are locked", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "papermotion-topics-")),
    old = process.env.PAPERMOTION_DATA_DIR;
  process.env.PAPERMOTION_DATA_DIR = dir;
  try {
    const topic = "How does a CPU work?",
      id = topicId(topic),
      lesson = {
        id,
        topic,
        version: 1 as const,
        model: "test fixture",
        createdAt: new Date().toISOString(),
        plan: topicFixture(),
      };
    await saveTopic(lesson);
    assert.deepEqual(await getTopic(id), lesson);
    assert.equal((await listTopics()).length, 1);
    await withTopicLock(id, async () => {
      await assert.rejects(
        () => withTopicLock(id, async () => {}),
        /already being planned/,
      );
    });
    await assert.rejects(() => getTopic("../escape"));
  } finally {
    if (old === undefined) delete process.env.PAPERMOTION_DATA_DIR;
    else process.env.PAPERMOTION_DATA_DIR = old;
    await rm(dir, { recursive: true, force: true });
  }
});
test("SDK planner reviews lessons and blocks unrelated templates before review", async () => {
  let calls = 0,
    invalid = false,
    approved = true;
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    const input = JSON.parse(body);
    assert.equal(input.store, false);
    calls++;
    const plan = interactiveFixture();
    if (invalid) plan.steps[0].experience.templateId = "attention";
    const review = input.text.format.name === "topic_plan_review";
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        id: "resp_test",
        object: "response",
        status: "completed",
        model: "test",
        output: [
          {
            id: "msg_test",
            type: "message",
            role: "assistant",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(
                  review
                    ? {
                        approved,
                        issues: approved ? [] : ["Incorrect worked example."],
                      }
                    : plan,
                ),
                annotations: [],
              },
            ],
          },
        ],
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const oldKey = process.env.OPENAI_API_KEY,
    oldBase = process.env.OPENAI_BASE_URL;
  process.env.OPENAI_API_KEY = "test-only-key";
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
  try {
    const r = await planTopic("How does a CPU work?", topicId("CPU"));
    assert.equal(r.plan.steps.length, 3);
    assert.equal(calls, 2);
    invalid = true;
    await assert.rejects(
      () => planTopic("CPU", "a".repeat(64)),
      /unsupported interactions/,
    );
    assert.equal(calls, 3);
    invalid = false;
    approved = false;
    await assert.rejects(
      () => planTopic("CPU", "a".repeat(64)),
      /review found issues/,
    );
    assert.equal(calls, 5);
    process.env.OPENAI_API_KEY = "";
    await assert.rejects(
      () => planTopic("CPU", "a".repeat(64)),
      /OPENAI_API_KEY/,
    );
    assert.equal(calls, 5);
  } finally {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
    if (oldBase === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = oldBase;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
