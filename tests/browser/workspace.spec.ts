import { test, expect } from "@playwright/test";
import { saveTopic, topicId } from "../../src/lib/topics/storage";
import { interactiveFixture, sceneFixtures } from "../helpers/sceneFixture";

test("homepage attention preview responds to word selection in both themes", async ({
  page,
}) => {
  await page.goto("/");
  const preview = page.getByRole("group", { name: "Self-attention preview" });
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: "Switch to dark mode" }).click();
    const before = await preview.locator("svg path").first().getAttribute("d");
    const next = theme === "light" ? "robot" : "papers";
    await preview.getByRole("button", { name: next, exact: true }).click();
    await expect(
      preview.getByRole("button", { name: next, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(preview.locator(".feature-query")).toHaveText(next);
    await expect(preview.locator("svg path").first()).not.toHaveAttribute(
      "d",
      before!,
    );
  }
});

test("workspace prioritizes canvas, preserves selected context and handles long labels across breakpoints", async ({
  page,
}) => {
  const topic = "Workspace responsive concept fixture",
    id = topicId(topic, "beginner", 2),
    plan = interactiveFixture();
  const scene = structuredClone(
    sceneFixtures.find((s) => s.type === "concept-map")!,
  );
  if (scene.type !== "concept-map") throw new Error("Missing concept fixture");
  scene.config.nodes[1].label = "W".repeat(80);
  plan.steps[0].experience.scene = scene;
  await saveTopic({
    id,
    topic,
    plan,
    version: 2,
    model: "test fixture",
    createdAt: new Date().toISOString(),
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [2560, 1920, 1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/learn/${id}`);
    await expect(page.locator(".topic-context")).toBeVisible();
    const stage = await page.locator(".topic-scene-stage").boundingBox(),
      context = await page.locator(".topic-context").boundingBox();
    if (width >= 1280) {
      expect(stage!.width).toBeGreaterThan(context!.width * 1.8);
      expect(context!.x).toBeGreaterThan(stage!.x + stage!.width);
    } else expect(context!.y).toBeGreaterThan(stage!.y + stage!.height);
    const buttons = page.locator(".scene-nodes button:visible");
    await buttons.nth(1).click();
    await expect(
      page.locator(".topic-context .scene-node-detail h3"),
    ).toHaveText("W".repeat(80));
    expect(
      await buttons
        .nth(1)
        .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
    ).toBe(true);
    await page.reload();
    await expect(
      page.locator(".topic-context .scene-node-detail h3"),
    ).toHaveText("W".repeat(80));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".context-notes summary").click();
    await expect(
      page.locator(".topic-context .topic-explanation"),
    ).not.toBeVisible();
    await page.locator(".context-notes summary").click();
    await expect(
      page.locator(".topic-context .topic-explanation"),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
