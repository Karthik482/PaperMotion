import { test, expect } from "@playwright/test";
import { interactiveFixture } from "../helpers/sceneFixture";
import { topicId, saveTopic } from "../../src/lib/topics/storage";
test("topic home accepts questions and explains missing-key failures", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "What would you like",
  );
  await page
    .getByRole("button", {
      name: "Why does a LEFT JOIN return NULL?",
      exact: false,
    })
    .click();
  await expect(page.getByLabel("Topic or question")).toHaveValue(
    "Why does a LEFT JOIN return NULL?",
  );
  await page
    .getByRole("button", { name: "Create learning path", exact: true })
    .click();
  await expect(page.locator(".research-error")).toContainText("OPENAI_API_KEY");
  expect(
    (await request.post("/api/topics", { data: { topic: "a" } })).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/topics", { data: { topic: "x".repeat(241) } })
    ).status(),
  ).toBe(400);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/topic-home-mobile.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("link", { name: /Inside the Transformer/ }),
  ).toHaveAttribute("href", "/lessons/transformer");
  await expect(
    page.getByRole("link", { name: /Learn from research/ }),
  ).toHaveAttribute("href", "/papers");
});
test("topic plan supports levels, steps, quizzes, honest coverage, progress and cached reopening", async ({
  page,
  request,
}) => {
  const topic = "How does a CPU work?",
    id = topicId(topic, "beginner", 3),
    plan = interactiveFixture();
  await saveTopic({
    id,
    topic,
    createdAt: new Date().toISOString(),
    version: 3,
    level: "beginner",
    model: "test fixture",
    plan,
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Topic or question").fill(topic);
  await page
    .getByRole("button", { name: "Create learning path", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/learn/${id}$`));
  await expect(page.locator(".topic-explanation")).toHaveText(
    plan.steps[0].beginner,
  );
  await page.getByRole("button", { name: "Technical", exact: true }).click();
  await expect(page.locator(".topic-explanation")).toHaveText(
    plan.steps[0].technical,
  );
  await expect(
    page.locator('[data-scene-type="process-diagram"]'),
  ).toBeVisible();
  await expect(page.locator(".planned-interaction")).toHaveCount(0);
  await page
    .getByRole("button", { name: "A Instructions", exact: true })
    .click();
  await expect(page.locator(".knowledge .feedback")).toContainText("Exactly");
  await expect(page.locator(".topic-progress")).toContainText(
    "1 / 3 understood",
  );
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    "Fetch, decode, execute",
  );
  const cached = await request.post("/api/topics", { data: { topic } });
  expect((await cached.json()).cached).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    "Fetch, decode, execute",
  );
  await expect(page.locator(".topic-progress")).toContainText(
    "1 / 3 understood",
  );
  await page.screenshot({
    path: "test-results/topic-lesson-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/topic-lesson-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("Transformer topic reuses the actual attention explorer", async ({
  page,
}) => {
  const topic = "Transformer self-attention integration test",
    id = topicId(topic, "beginner", 2),
    plan = interactiveFixture();
  plan.title = "Understanding Transformer attention";
  plan.domain = "Machine learning";
  plan.steps[0].title = "Self-attention";
  plan.steps[0].beginner = "Each word gathers context from the other words.";
  plan.steps[0].experience = {
    templateId: "attention",
    rationale: "The toy explorer demonstrates attention probabilities.",
    suggestedInteraction:
      "Choose a query word and change temperature to compare the weights.",
  };
  await saveTopic({
    id,
    topic,
    createdAt: new Date().toISOString(),
    version: 1,
    model: "test fixture",
    plan,
  });
  await page.goto(`/learn/${id}`);
  await expect(page.locator("#temperature")).toBeVisible();
  const before = await page.locator(".weight-row").textContent();
  await page.getByRole("button", { name: "robot", exact: true }).click();
  await expect(page.locator(".weight-row")).not.toHaveText(before!);
  await expect(page.locator(".planned-interaction")).toHaveCount(0);
});
