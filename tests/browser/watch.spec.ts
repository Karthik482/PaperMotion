import { test, expect } from "@playwright/test";
import { referenceLessons } from "../../src/lib/topics/references";
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
