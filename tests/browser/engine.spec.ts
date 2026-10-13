import { test, expect } from "@playwright/test";
import { referenceLessons } from "../../src/lib/topics/references";
import { saveTopic, topicId } from "../../src/lib/topics/storage";
import { interactiveFixture } from "../helpers/sceneFixture";
import type { Scene } from "../../src/lib/scenes/schemas";
for (const lesson of referenceLessons) {
  test(`reference ${lesson.plan.domain}: meaningful controls, reset, navigation and responsive themes`, async ({
    page,
    request,
  }) => {
    const errors: string[] = [];
    let modelRequests = 0;
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().includes("/api/topics"))
        modelRequests++;
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/learn/${lesson.id}`);
    const scene = page.locator(".universal-scene"),
      type = lesson.plan.steps[0].experience.scene!.type;
    await expect(scene).toHaveAttribute("data-scene-type", type);
    if (type === "gradient-descent") {
      await expect(scene.getByLabel("Final loss", { exact: true })).toHaveText(
        "0.0967",
      );
      await scene.getByRole("slider", { name: /Learning rate/ }).fill("0.1");
      await expect(scene.getByLabel("Final loss", { exact: true })).toHaveText(
        "1.7180",
      );
      await scene
        .getByRole("button", { name: "Step backward", exact: true })
        .click();
      await expect(
        scene.getByRole("slider", { name: /Iterations/ }),
      ).toHaveValue("4");
    } else if (type === "task-scheduler") {
      await expect(
        scene.getByLabel("Estimated job time", { exact: true }),
      ).toHaveText("4 s");
      await scene.getByRole("slider", { name: /Executor processes/ }).fill("4");
      await expect(
        scene.getByLabel("Estimated job time", { exact: true }),
      ).toHaveText("2 s");
      await scene.getByRole("slider", { name: /Execution step/ }).fill("2");
      await expect(scene.getByLabel("Result sum", { exact: true })).toHaveText(
        "300",
      );
      await scene.getByRole("button", { name: /Partition 1 complete/ }).click();
      await expect(page.locator(".scene-node-detail")).toContainText("values:");
      await scene
        .getByRole("button", {
          name: "Compare with starting settings",
          exact: true,
        })
        .click();
      await expect(scene.locator(".engine-comparison")).toContainText(
        "baseline: 4 s",
      );
    } else if (type === "supply-demand") {
      await expect(
        scene.getByLabel("Equilibrium quantity", { exact: true }),
      ).toHaveText("40");
      const points = await scene
        .locator(".demand-curve")
        .getAttribute("points");
      await scene.getByRole("slider", { name: /Demand shift/ }).fill("20");
      await expect(
        scene.getByLabel("Equilibrium quantity", { exact: true }),
      ).toHaveText("50");
      await expect(
        scene.getByLabel("Equilibrium price", { exact: true }),
      ).toHaveText("70");
      expect(
        await scene.locator(".demand-curve").getAttribute("points"),
      ).not.toBe(points);
      await scene
        .getByRole("button", {
          name: "Compare with starting settings",
          exact: true,
        })
        .click();
      await expect(scene.locator(".baseline-curve")).toHaveCount(2);
    } else if (type === "dna-replication") {
      await expect(scene.locator(".dna-strand")).toHaveCount(2);
      await scene
        .getByRole("button", { name: "Step forward", exact: true })
        .click();
      await expect(scene.locator(".replication-fork")).toBeVisible();
      await expect(page.locator(".scene-node-detail")).toContainText(
        "Helicase",
      );
      await scene.getByLabel("Enzyme annotations").uncheck();
      await expect(scene.locator(".enzyme-labels")).toHaveCount(0);
      await scene.getByRole("slider", { name: /Execution step/ }).fill("3");
      await expect(scene.locator(".fragmented-strand")).toBeVisible();
      await scene
        .getByRole("button", { name: "Step forward", exact: true })
        .click();
      await expect(
        scene.getByLabel("Daughter duplexes", { exact: true }),
      ).toHaveText("2");
      await expect(scene.locator(".sealed-strand")).toBeVisible();
      await scene
        .getByRole("button", { name: "Base 1: A", exact: true })
        .first()
        .click();
      await expect(page.locator(".scene-node-detail")).toContainText(
        "Base pair 1",
      );
    } else if (type === "historical-timeline") {
      await expect(
        scene.getByLabel("Selected date", { exact: true }),
      ).toHaveText("1967-01-27");
      await scene.getByRole("button", { name: /Apollo 7 launches/ }).click();
      await expect(
        scene.getByLabel("Selected date", { exact: true }),
      ).toHaveText("1968-10-11");
      await expect(
        page.getByRole("link", { name: /NASA source evidence/ }),
      ).toHaveAttribute(
        "href",
        "https://www.nasa.gov/specials/apollo50th/missions.html",
      );
      await scene
        .getByRole("button", { name: "Compare timeline tracks", exact: true })
        .click();
      await expect(scene.locator(".timeline-tracks")).toBeVisible();
      await expect(page.locator(".scene-node-detail")).toContainText(
        "Earth-orbit flight",
      );
    }
    await scene
      .getByRole("button", { name: "Reset scene", exact: true })
      .click();
    if (type === "gradient-descent")
      await expect(scene.getByLabel("Final loss", { exact: true })).toHaveText(
        "0.0967",
      );
    if (type === "task-scheduler") {
      await expect(
        scene.getByLabel("Estimated job time", { exact: true }),
      ).toHaveText("4 s");
      await expect(scene.getByLabel("Result sum", { exact: true })).toHaveText(
        "Pending",
      );
    }
    if (type === "supply-demand")
      await expect(
        scene.getByLabel("Equilibrium quantity", { exact: true }),
      ).toHaveText("40");
    if (type === "dna-replication") {
      await expect(scene.locator(".replication-fork")).toHaveCount(0);
      await expect(scene.getByLabel("Enzyme annotations")).toBeChecked();
    }
    if (type === "historical-timeline")
      await expect(
        scene.getByLabel("Selected date", { exact: true }),
      ).toHaveText("1967-01-27");
    if (type !== "supply-demand") {
      await scene
        .getByRole("button", { name: "Replay from start", exact: true })
        .click();
      await scene
        .getByLabel("Playback speed", { exact: true })
        .selectOption("2");
      await scene
        .getByRole("button", { name: "Play simulation", exact: true })
        .click();
      await expect(scene.getByRole("slider").last()).not.toHaveValue("0");
      const pause = scene.getByRole("button", {
        name: "Pause simulation",
        exact: true,
      });
      if (await pause.count()) {
        await pause.click();
        const value = await scene.getByRole("slider").last().inputValue();
        await page.waitForTimeout(750);
        await expect(scene.getByRole("slider").last()).toHaveValue(value);
      }
      await scene
        .getByRole("button", { name: "Reset scene", exact: true })
        .click();
    }
    await page
      .getByRole("button", {
        name: `${String.fromCharCode(65 + lesson.plan.steps[0].check.answer)} ${lesson.plan.steps[0].check.options[lesson.plan.steps[0].check.answer]}`,
        exact: true,
      })
      .click();
    await expect(page.locator(".topic-progress")).toContainText(
      "1 / 3 understood",
    );
    for (let i = 1; i < 3; i++) {
      await page
        .getByRole("button", { name: "Next step", exact: true })
        .click();
      await expect(page.getByRole("heading", { level: 2 })).toHaveText(
        lesson.plan.steps[i].title,
      );
    }
    for (const width of [1440, 390])
      for (const theme of ["light", "dark"]) {
        await page.setViewportSize({ width, height: 1000 });
        const current = await page.locator("html").getAttribute("data-theme");
        if (current !== theme)
          await page
            .getByRole("button", { name: `Switch to ${theme} mode` })
            .click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: `test-results/phase35-${type}-${width}-${theme}.png`,
          fullPage: true,
        });
      }
    await page.reload();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(
      lesson.plan.steps[2].title,
    );
    expect((await request.get(`/api/topics/${lesson.id}`)).status()).toBe(200);
    expect(modelRequests).toBe(0);
    expect(errors).toEqual([]);
  });
}
test("data traces, spatial views and annotation layers run through the universal player", async ({
  page,
}) => {
  const scenes: Scene[] = [
    {
      type: "data-explorer",
      title: "Inspect a left join",
      description: "Process key matches and missing values",
      assumptions: ["Local exact rows"],
      config: {
        operation: "left-join",
        rows: [
          { id: "a", key: "A", value: 3 },
          { id: "b", key: "B", value: 1 },
        ],
        lookup: [{ id: "right", key: "A", label: "matched" }],
        threshold: 2,
      },
    },
    {
      type: "spatial-explorer",
      title: "Measure a distance",
      description: "Inspect Cartesian relationships",
      assumptions: ["Illustrative coordinates, not geography"],
      config: {
        units: "units",
        points: [
          {
            id: "origin",
            label: "Origin",
            description: "Starting point",
            x: 0,
            y: 0,
          },
          {
            id: "destination",
            label: "Destination",
            description: "Three across, four up",
            x: 3,
            y: 4,
          },
        ],
      },
    },
    {
      type: "annotated-illustration",
      title: "Inspect and hide a layer",
      description: "Step through labeled shapes",
      assumptions: ["Illustrative geometry"],
      config: {
        regions: [
          {
            id: "a",
            label: "Template",
            description: "An illustrative template",
            shape: "rectangle",
            x: 30,
            y: 40,
            width: 30,
            height: 20,
            layer: "templates",
          },
          {
            id: "b",
            label: "Product",
            description: "An illustrative product",
            shape: "ellipse",
            x: 70,
            y: 60,
            width: 30,
            height: 20,
            layer: "products",
          },
        ],
        frames: [
          {
            label: "First frame",
            note: "Inspect the starting template",
            visibleIds: ["a"],
          },
          {
            label: "Second frame",
            note: "Inspect both structures",
            visibleIds: ["a", "b"],
          },
        ],
      },
    },
  ];
  for (const s of scenes) {
    const topic = `Phase35 ${s.type}`,
      id = topicId(topic, "beginner", 2),
      plan = interactiveFixture();
    plan.steps[0].experience.scene = s;
    await saveTopic({
      id,
      topic,
      plan,
      version: 2,
      model: "test fixture",
      createdAt: new Date().toISOString(),
    });
    await page.goto(`/learn/${id}`);
    const scene = page.locator(".universal-scene");
    await expect(scene).toHaveAttribute("data-scene-type", s.type);
    if (s.type === "data-explorer") {
      await scene
        .getByRole("button", { name: "Step forward", exact: true })
        .click();
      await scene
        .getByRole("button", { name: "Step forward", exact: true })
        .click();
      await expect(scene.locator("table").last()).toContainText("NULL");
      await expect(scene.getByLabel("Output rows", { exact: true })).toHaveText(
        "2",
      );
      await scene.getByRole("slider", { name: /Value: A/ }).fill("4");
      await expect(
        scene.getByLabel("Execution step", { exact: true }),
      ).toHaveText("0");
    } else {
      await scene.getByRole("button", { name: "Zoom in", exact: true }).click();
      await expect(scene.getByLabel("Zoom level", { exact: true })).toHaveText(
        "125%",
      );
      await scene
        .getByRole("button", { name: "Pan right", exact: true })
        .click();
      await expect(scene.locator("svg > g")).toHaveAttribute(
        "transform",
        /translate\(560 /,
      );
      await scene
        .getByRole("button", { name: "Fit view", exact: true })
        .click();
      await expect(scene.getByLabel("Zoom level", { exact: true })).toHaveText(
        "100%",
      );
      if (s.type === "spatial-explorer") {
        await scene
          .locator(".spatial-mobile-points")
          .getByRole("button", { name: "Destination", exact: true })
          .click();
        await expect(
          scene.getByLabel("Distance from Origin", { exact: true }),
        ).toHaveText("5 units");
      } else {
        await scene
          .getByRole("button", { name: "Step forward", exact: true })
          .click();
        await expect(scene.locator(".annotation-region")).toHaveCount(2);
        await scene.getByLabel("products", { exact: true }).uncheck();
        await expect(scene.locator(".annotation-region")).toHaveCount(1);
      }
    }
    await scene
      .getByRole("button", { name: "Reset scene", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
});
