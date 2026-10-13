import { test } from "node:test";
import assert from "node:assert/strict";
import { appendTurn, readTutorStream } from "../src/lib/tutor/client";
test("conversation memory bounds older turns without dropping the active scene identity", () => {
  let memory = {
    turns: [] as {
      role: "user" | "assistant";
      text: string;
      sceneId: string;
    }[],
    summary: "",
  };
  for (let i = 0; i < 30; i++)
    memory = appendTurn(memory, {
      role: "user",
      text: `Question ${i}`,
      sceneId: "scene-a",
    });
  assert.equal(memory.turns.length, 16);
  assert.equal(memory.turns[15].text, "Question 29");
  assert.ok(memory.summary.length <= 1200);
  assert.ok(memory.summary.includes("Question 13"));
});
test("stream consumer reports status but never accepts partial action JSON or provider errors", async () => {
  const statuses: string[] = [];
  await assert.rejects(
    readTutorStream(
      new Response(
        '{"type":"status","text":"Validating"}\n{"type":"result","proposal":{"actions":[',
        { headers: { "Content-Type": "application/x-ndjson" } },
      ),
      (s) => statuses.push(s),
    ),
    /before a validated/,
  );
  assert.deepEqual(statuses, ["Validating"]);
  await assert.rejects(
    readTutorStream(
      new Response('{"type":"error","message":"Unsupported action"}\n'),
      () => {},
    ),
    /Unsupported/,
  );
});
