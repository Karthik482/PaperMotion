import { test, expect } from "@playwright/test";
import { referenceLessons } from "../../src/lib/topics/references";
import { saveTopic, topicId } from "../../src/lib/topics/storage";
import { interactiveFixture } from "../helpers/sceneFixture";
import type { Scene } from "../../src/lib/scenes/schemas";
for (const lesson of referenceLessons)
  test(`Watch shares local state: ${lesson.plan.domain}`, async ({ page }) => {
    await page.goto(`/learn/${lesson.id}`);
    const scene = page.locator(".universal-scene");
    await expect(scene).toBeVisible();
    await scene.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(scene.locator(".watch-sequence")).toBeVisible();
    await scene
      .getByRole("button", { name: "Play walkthrough", exact: true })
      .click();
    await expect(
      scene.getByRole("button", { name: "Pause walkthrough" }),
    ).toBeVisible();
    await scene.getByRole("button", { name: "Pause walkthrough" }).click();
    const before = await page.evaluate(
      () =>
        Object.entries(localStorage).find(([k]) =>
          k.startsWith("scene-player:v2:"),
        )?.[1],
    );
    await scene.getByRole("button", { name: "Explore", exact: true }).click();
    const after = await page.evaluate(
      () =>
        Object.entries(localStorage).find(([k]) =>
          k.startsWith("scene-player:v2:"),
        )?.[1],
    );
    expect(after).toBe(before);
    await scene.getByRole("button", { name: "Watch", exact: true }).click();
    await scene.getByRole("button", { name: "Replay walkthrough" }).click();
    await expect(
      scene.getByRole("progressbar", { name: "Animation progress" }),
    ).toHaveAttribute("value", "1");
    await scene.getByRole("button", { name: "Next frame" }).click();
    await expect(
      scene.getByRole("progressbar", { name: "Animation progress" }),
    ).toHaveAttribute("value", "2");
    await scene.getByRole("button", { name: "Previous frame" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(
      scene.getByRole("progressbar", { name: "Animation progress" }),
    ).toHaveAttribute("value", "1");
    await scene.getByRole("button", { name: "Reset scene" }).click();
    await page.reload();
    await expect(
      scene.getByRole("button", { name: "Explore", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      scene.getByRole("button", { name: "Watch", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
  });
test("reduced motion uses manual frames and never autoplay", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/learn/${referenceLessons[3].id}`);
  await page.getByRole("button", { name: "Watch", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play walkthrough", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next frame" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Animation progress" }),
  ).toHaveAttribute("value", "1");
});
test("watch advances, pauses and resumes actual optimization state", async ({
  page,
}) => {
  await page.goto(`/learn/${referenceLessons[0].id}`);
  await page.getByRole("button", { name: "Watch", exact: true }).click();
  await page
    .getByRole("button", { name: "Play walkthrough", exact: true })
    .click();
  const progress = page.getByRole("progressbar", {
    name: "Animation progress",
  });
  await expect(progress).toHaveAttribute("value", "2");
  await page.getByRole("button", { name: "Pause walkthrough" }).click();
  const value = await progress.getAttribute("value");
  await page.waitForTimeout(900);
  await expect(progress).toHaveAttribute("value", value!);
  await page
    .getByRole("button", { name: "Play walkthrough", exact: true })
    .click();
  await expect(progress).toHaveAttribute("value", String(Number(value) + 1));
  await page.getByRole("button", { name: "Pause walkthrough" }).click();
  await page.getByRole("slider", { name: /Learning rate/ }).fill("0.1");
  await expect(
    page.getByRole("button", { name: "Play walkthrough", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("slider", { name: /Learning rate/ })).toHaveValue(
    "0.1",
  );
});
test("an authored timeline incompatible with changed controls uses a safe local walkthrough", async ({
  page,
}) => {
  const scene: Scene = {
      ...referenceLessons[1].plan.steps[0].experience.scene!,
      watch: {
        version: 1,
        title: "Focus the fourth partition",
        frames: [
          {
            caption: "Select the fourth task",
            durationMs: 500,
            actions: [
              {
                version: 1,
                type: "select",
                target: "scene",
                payload: { id: "task-3" },
              },
            ],
          },
        ],
      },
    },
    plan = interactiveFixture(),
    id = topicId("Phase4 bounded watch compatibility");
  plan.steps.forEach((s) => (s.experience.scene = scene));
  await saveTopic({
    id,
    topic: "Phase4 bounded watch compatibility",
    plan,
    version: 2,
    model: "test fixture",
    createdAt: new Date().toISOString(),
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`/learn/${id}`);
  await page.getByRole("slider", { name: /Dataset partitions/ }).fill("1");
  await page.getByRole("button", { name: "Watch", exact: true }).click();
  await expect(page.locator(".watch-error")).toContainText("no longer fits");
  await page.getByRole("button", { name: "Next frame" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Animation progress" }),
  ).toHaveAttribute("value", "1");
  expect(errors).toEqual([]);
});
