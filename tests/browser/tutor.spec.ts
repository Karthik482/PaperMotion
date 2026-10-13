import { test, expect, type Page } from "@playwright/test";
import { referenceLessons } from "../../src/lib/topics/references";
const questions = [
  "What happens if the learning rate is too high?",
  "What if I increase executor capacity?",
  "What happens if demand increases?",
  "Show me how the leading strand is synthesized.",
  "What happened before the Apollo 11 landing?",
];
async function ask(page: Page, text: string) {
  const panel = page.locator(".tutor-panel");
  await panel.getByLabel("Your question", { exact: true }).fill(text);
  await panel.getByRole("button", { name: "Ask tutor", exact: true }).click();
  await expect(panel.locator(".tutor-answer")).toBeVisible();
  await expect(panel.locator(".tutor-error")).toHaveCount(0);
}
for (const [index, lesson] of referenceLessons.entries())
  test(`connected conversation: ${lesson.plan.domain}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/learn/${lesson.id}`);
    const scene = page.locator(".universal-scene"),
      panel = page.locator(".tutor-panel");
    await scene.getByRole("button", { name: "Watch", exact: true }).click();
    await scene
      .getByRole("button", { name: "Play walkthrough", exact: true })
      .click();
    await scene
      .getByRole("button", { name: "Pause walkthrough", exact: true })
      .click();
    await ask(page, questions[index]);
    await expect(
      panel.getByRole("button", { name: "Apply to scene", exact: true }),
    ).toBeEnabled();
    await panel
      .getByRole("button", { name: "Apply to scene", exact: true })
      .click();
    if (index === 0) {
      await expect(
        scene.getByRole("slider", { name: /Learning rate/ }),
      ).toHaveValue("1.2");
      await expect(scene.getByLabel("Final loss", { exact: true })).toHaveText(
        "462.8074",
      );
      await expect(panel.locator(".tutor-results")).toContainText("462.807");
    }
    if (index === 1) {
      await expect(
        scene.getByRole("slider", { name: /Executor processes/ }),
      ).toHaveValue("4");
      await expect(
        scene.getByLabel("Estimated job time", { exact: true }),
      ).toHaveText("2 s");
    }
    if (index === 2) {
      await expect(
        scene.getByRole("slider", { name: /Demand shift/ }),
      ).toHaveValue("20");
      await expect(
        scene.getByLabel("Equilibrium quantity", { exact: true }),
      ).toHaveText("50");
    }
    if (index === 3) {
      await expect(
        scene.locator('[data-dna-actor="dna-leading"]'),
      ).toHaveAttribute("data-tutor-highlight", "true");
      await expect(scene.locator(".fragmented-strand")).toBeVisible();
      await expect(panel.locator(".tutor-sources a")).toHaveAttribute(
        "href",
        "https://www.ncbi.nlm.nih.gov/books/NBK26850/",
      );
    }
    if (index === 4) {
      await expect(
        page
          .getByRole("navigation", { name: "Learning steps" })
          .locator("button[aria-current=step]"),
      ).not.toContainText(lesson.plan.steps[0].title);
    }
    await ask(page, "Why did that happen?");
    await expect(panel.locator(".tutor-results")).toContainText(
      index === 3 ? "Extend" : index === 2 ? "50" : index === 1 ? "2" : "",
    );
    await scene.getByRole("button", { name: "Explore", exact: true }).click();
    if (index === 0)
      await scene.getByRole("slider", { name: /Learning rate/ }).fill("0.1");
    else if (index === 1)
      await scene.getByRole("slider", { name: /Executor processes/ }).fill("3");
    else if (index === 2)
      await scene.getByRole("slider", { name: /Demand shift/ }).fill("10");
    else
      await scene
        .getByRole("button", { name: "Step forward", exact: true })
        .click();
    await ask(page, "Explain the current state more simply.");
    await expect(panel.locator(".tutor-results")).toContainText(
      index === 0
        ? "1.717"
        : index === 1
          ? "Estimated job time"
          : index === 2
            ? "45"
            : index === 3
              ? "Replace"
              : "Selected event",
    );
    await scene
      .getByRole("button", { name: "Reset scene", exact: true })
      .click();
    await page.reload();
    await expect(panel.locator(".tutor-transcript")).toContainText(
      "Explain the current state",
    );
    await expect(panel.locator(".tutor-answer")).toHaveCount(0);
    if (index === 0)
      await expect(
        scene.getByRole("slider", { name: /Learning rate/ }),
      ).toHaveValue("0.2");
    await expect(
      page.getByRole("button", { name: "Explore", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    for (const theme of ["light", "dark"])
      for (const size of [
        [2560, 1440],
        [1920, 1080],
        [1440, 900],
        [1280, 800],
        [768, 1024],
        [390, 844],
      ]) {
        await page.setViewportSize({ width: size[0], height: size[1] });
        await page.evaluate((t) => {
          document.documentElement.dataset.theme = t;
          localStorage.setItem("papermotion-theme", t);
        }, theme);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await expect(
          panel.getByLabel("Your question", { exact: true }),
        ).toBeVisible();
        await page.screenshot({
          path: `test-results/phase4-${index}-${theme}-${size[0]}.png`,
          fullPage: true,
        });
      }
    expect(errors).toEqual([]);
  });
test("slow answers expire after local edits, cancel cleanly and never leak to another lesson", async ({
  page,
}) => {
  await page.goto(`/learn/${referenceLessons[0].id}`);
  const panel = page.locator(".tutor-panel");
  await panel
    .getByLabel("Your question", { exact: true })
    .fill("Slow demonstration please");
  await panel.getByRole("button", { name: "Ask tutor", exact: true }).click();
  await page.getByRole("slider", { name: /Learning rate/ }).fill("0.1");
  await expect(
    panel.getByRole("button", { name: "Proposal expired" }),
  ).toBeDisabled();
  await expect(page.getByRole("slider", { name: /Learning rate/ })).toHaveValue(
    "0.1",
  );
  await panel
    .getByLabel("Your question", { exact: true })
    .fill("Slow response again");
  await panel.getByRole("button", { name: "Ask tutor", exact: true }).click();
  await panel
    .getByRole("button", { name: "Stop response", exact: true })
    .click();
  await expect(panel.locator(".tutor-status")).toContainText("stopped");
  await ask(page, "Explain the current state");
  await panel.getByRole("button", { name: "Clear conversation" }).click();
  await expect(panel.locator(".tutor-transcript")).toHaveCount(0);
  await page.goto(`/learn/${referenceLessons[1].id}`);
  await expect(page.locator(".tutor-transcript")).toHaveCount(0);
});
test("unsupported actions and provider failures expose recovery without changing the model", async ({
  page,
}) => {
  await page.goto(`/learn/${referenceLessons[1].id}`);
  const panel = page.locator(".tutor-panel");
  for (const question of ["Unsupported action please", "Failed request"]) {
    await panel.getByLabel("Your question", { exact: true }).fill(question);
    await panel.getByRole("button", { name: "Ask tutor", exact: true }).click();
    await expect(panel.locator(".tutor-error")).toBeVisible();
    await expect(
      page.getByRole("slider", { name: /Executor processes/ }),
    ).toHaveValue("2");
    await expect(
      panel.getByRole("button", { name: "Apply to scene", exact: true }),
    ).toHaveCount(0);
  }
  await ask(page, "Explain the current state");
});
