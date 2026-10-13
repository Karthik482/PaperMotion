import { test, expect } from "@playwright/test";
import { saveTopic, topicId } from "../../src/lib/topics/storage";
import { interactiveFixture, sceneFixtures } from "../helpers/sceneFixture";

test("every trusted scene runs, responds to controls and has no console errors in both themes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  for (const fixture of sceneFixtures) {
    const topic = `Scene acceptance ${fixture.type}`,
      id = topicId(topic, "beginner", 2),
      plan = interactiveFixture();
    plan.title = fixture.title;
    plan.steps[0].experience.scene = fixture;
    await saveTopic({
      id,
      topic,
      plan,
      version: 2,
      level: "beginner",
      model: "test fixture",
      createdAt: new Date().toISOString(),
    });
    await page.goto(`/learn/${id}`);
    const scene = page.locator(".universal-scene");
    await expect(scene).toHaveAttribute("data-scene-type", fixture.type);
    const sliders = scene.getByRole("slider");
    if (await sliders.count()) {
      const before = await scene.textContent(),
        slider = sliders.first(),
        max = await slider.getAttribute("max"),
        min = await slider.getAttribute("min");
      await slider.fill(max === (await slider.inputValue()) ? min! : max!);
      await expect(scene).not.toHaveText(before!);
    } else {
      const buttons = scene.locator(".scene-nodes button:visible");
      await buttons.nth(1).click();
      await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
    }
    await scene
      .getByRole("button", { name: "Reset scene", exact: true })
      .click();
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/scene-${fixture.type}-dark-mobile.png`,
      fullPage: true,
      caret: "initial",
    });
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  expect(errors).toEqual([]);
});
test("computed gradient loss, replay, pause and restored lesson state work without AI calls", async ({
  page,
  request,
}) => {
  const topic = "Gradient descent acceptance",
    id = topicId(topic, "technical", 2),
    plan = interactiveFixture();
  plan.steps[0].experience.scene = sceneFixtures[0];
  await saveTopic({
    id,
    topic,
    plan,
    version: 2,
    level: "technical",
    model: "test fixture",
    createdAt: new Date().toISOString(),
  });
  await page.goto(`/learn/${id}`);
  await expect(
    page.getByRole("button", { name: "Technical", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const scene = page.locator(".universal-scene");
  await expect(scene.getByLabel("Final loss", { exact: true })).toHaveText(
    "0.0967",
  );
  await scene.getByLabel("Learning rate", { exact: false }).fill("0.1");
  await expect(scene.getByLabel("Final loss", { exact: true })).not.toHaveText(
    "0.0967",
  );
  await page.reload();
  await expect(scene.getByLabel("Learning rate", { exact: false })).toHaveValue(
    "0.1",
  );
  await scene.getByRole("button", { name: "Reset scene", exact: true }).click();
  await expect(scene.getByLabel("Final loss", { exact: true })).toHaveText(
    "0.0967",
  );
  await scene
    .getByRole("button", { name: "Replay from start", exact: true })
    .click();
  await expect(scene.getByRole("slider", { name: /Iterations/ })).toHaveValue(
    "0",
  );
  await scene
    .getByRole("button", { name: "Step forward", exact: true })
    .click();
  await expect(scene.getByRole("slider", { name: /Iterations/ })).toHaveValue(
    "1",
  );
  await scene
    .getByRole("button", { name: "Play simulation", exact: true })
    .click();
  await expect(
    scene.getByRole("slider", { name: /Iterations/ }),
  ).not.toHaveValue("1");
  await scene
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  const paused = await scene
    .getByRole("slider", { name: /Iterations/ })
    .inputValue();
  await page.waitForTimeout(800);
  await expect(scene.getByRole("slider", { name: /Iterations/ })).toHaveValue(
    paused,
  );
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(
    plan.steps[1].title,
  );
  const cached = await request.post("/api/topics", {
    data: { topic, level: "technical", engineVersion: 2 },
  });
  expect((await cached.json()).cached).toBe(true);
});
test("dark mode persists across routes and reload; reduced motion keeps simulations manual", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.goto("/papers");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/lessons/transformer");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const topic = "Reduced-motion scene",
    id = topicId(topic, "beginner", 2),
    plan = interactiveFixture();
  plan.steps[0].experience.scene = sceneFixtures[0];
  await saveTopic({
    id,
    topic,
    plan,
    version: 2,
    model: "test fixture",
    createdAt: new Date().toISOString(),
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/learn/${id}`);
  await expect(
    page.getByRole("button", { name: "Play simulation" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Step forward" }).click();
  await expect(page.locator(".scene-step-control input")).toHaveValue("6");
});
