import { test, expect } from "@playwright/test";

test("positional encoding hydrates cleanly and reset restores local diagram controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/lessons/transformer?module=3");
  await page.getByLabel("Token position").fill("15");
  await expect(page.getByLabel("Token position")).toHaveValue("15");
  await expect(
    page.getByRole("button", { name: "Play animation", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByLabel("Token position")).toHaveValue("2");
  await page.getByRole("button", { name: /One word at a time/ }).click();
  await page.getByRole("button", { name: "papers", exact: true }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator(".tokens button[aria-pressed=true]")).toHaveText(
    "learned",
  );
  expect(errors).toEqual([]);
});

test("reduced motion uses manual queries without SVG motion or automatic cycling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lessons/transformer");
  await page.getByRole("button", { name: "Next query", exact: true }).click();
  const selected = page.locator(".tokens button[aria-pressed=true]");
  await expect(selected).toContainText("to");
  await page.waitForTimeout(1800);
  await expect(selected).toContainText("to");
  await expect(page.locator("animateMotion")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Play animation", exact: true }),
  ).toHaveCount(0);
});

test("mobile keeps notes, outline and primary actions usable without page overflow", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByLabel("Topic or question")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390)
      expect(
        (await page.getByLabel("Topic or question").boundingBox())!.y,
      ).toBeLessThan(360);
    await page.goto("/lessons/transformer");
    await expect(page.locator(".explainer")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 768) {
      await expect(page.locator(".lesson-outline")).not.toHaveAttribute(
        "open",
        "",
      );
      await page.locator(".lesson-outline summary").click();
    }
    await page.getByRole("button", { name: /Multi-head attention/ }).click();
    await page.getByLabel("Attention heads").selectOption("8");
    await expect(page.locator(".head-card")).toHaveCount(8);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
