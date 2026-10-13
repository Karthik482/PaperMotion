import { test, expect } from "@playwright/test";
test("acceptance: modules, live math, playback, heads, feedback and mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/lessons/transformer");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Attention Is All You Need",
  );
  await page.screenshot({
    path: "test-results/papermotion-desktop.png",
    fullPage: true,
    caret: "initial",
  });
  const distribution = page.locator(".weight-row");
  const before = await distribution.textContent();
  await page.getByRole("button", { name: "robot", exact: true }).click();
  await expect(distribution).not.toHaveText(before!);
  const selected = await distribution.textContent();
  await page.locator("#temperature").fill("0.25");
  await expect(distribution).not.toHaveText(selected!);
  await expect(page.locator(".attention-footer strong")).toHaveText("Σ 100.0%");
  await page
    .getByRole("button", { name: "Play animation", exact: true })
    .click();
  await expect(
    page.locator('.tokens button[aria-pressed="true"]'),
  ).not.toContainText("robot", { timeout: 5000 });
  await page
    .getByRole("button", { name: "Pause animation", exact: true })
    .click();
  const paused = await page
    .locator('.tokens button[aria-pressed="true"]')
    .textContent();
  await page.waitForTimeout(1800);
  await expect(page.locator('.tokens button[aria-pressed="true"]')).toHaveText(
    paused!,
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("#temperature")).toHaveValue("1");
  await expect(
    page.locator('.tokens button[aria-pressed="true"]'),
  ).toContainText("learned");
  await page
    .getByRole("button", { name: "B 1 (or 100%)", exact: true })
    .click();
  await expect(page.locator(".knowledge").getByRole("status")).toContainText(
    "Exactly",
  );
  await expect(page.locator(".progress-box strong")).toHaveText("1/6");
  await page.getByRole("button", { name: /03 Multi-head attention/ }).click();
  await page.getByLabel("Attention heads").selectOption("8");
  await expect(page.locator(".head-card")).toHaveCount(8);
  for (const title of [
    "The big picture",
    "A sense of position",
    "One word at a time",
    "Bring it together",
  ]) {
    await page
      .locator("nav")
      .getByRole("button", { name: new RegExp(title) })
      .click();
    await expect(
      page.getByRole("heading", { level: 2, name: title, exact: true }),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".lesson-outline summary").click();
  await page
    .locator("nav")
    .getByRole("button", { name: /Self-attention/ })
    .click();
  await expect(page.locator("#temperature")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/papermotion-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
