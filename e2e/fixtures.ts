import { expect, test as base, type Page } from "@playwright/test";

type Node = Record<string, unknown>;

const island = (
  id: string,
  name: string,
  color: string,
  x: number,
  y: number,
) => ({
  id,
  type: "island",
  position: { x, y },
  width: 700,
  height: 500,
  dragHandle: ".island-drag-handle",
  selectable: false,
  data: { name, color },
});
const building = (
  id: string,
  parentId: string,
  buildingId: string,
  count: number,
) => ({
  id,
  type: "building",
  parentId,
  position: { x: 40, y: 90 },
  data: { buildingId, count, productivity: 100 },
});
const residence = (
  id: string,
  parentId: string,
  tierId: string,
  houses: number,
) => ({
  id,
  type: "residence",
  parentId,
  position: { x: 40, y: 90 },
  data: { tierId, houses },
});
const edge = (id: string, source: string, target: string, good: string) => ({
  id,
  type: "flow",
  source,
  target,
  sourceHandle: `out:${good}`,
  targetHandle: `in:${good}`,
});

/** Three islands: farmers on Crown Falls, workers on Sunny Isle, bricks on Brick Rock. */
export const threeIslands = {
  nodes: [
    island("A", "Crown Falls", "oklch(0.68 0.13 235)", 0, 0),
    island("B", "Sunny Isle", "oklch(0.7 0.15 150)", 900, 0),
    island("C", "Brick Rock", "oklch(0.75 0.14 75)", 0, 700),
    building("fish", "A", "1010278", 3),
    building("sheep", "A", "1010267", 2),
    building("knit", "A", "1010315", 2),
    residence("farm", "A", "15000000", 60),
    building("pot", "B", "1010265", 2),
    building("dist", "B", "1010294", 2),
    residence("work", "B", "15000001", 20),
    building("clay", "C", "100416", 1),
    building("brick", "C", "1010283", 2),
  ],
  edges: [
    edge("e1", "sheep", "knit", "1010197"),
    edge("e2", "fish", "farm", "1010200"),
    edge("e3", "knit", "farm", "1010237"),
    edge("e4", "pot", "dist", "1010195"),
    edge("e5", "dist", "work", "1010216"),
    edge("x1", "fish", "work", "1010200"),
    edge("x2", "knit", "work", "1010237"),
    edge("x3", "dist", "farm", "1010216"),
    edge("c1", "clay", "brick", "1010201"),
  ],
};

/** Opens the modeler with a plan already saved, then arranges it. */
export async function openPlan(
  page: Page,
  plan: { nodes: Node[]; edges: Node[] },
) {
  await page.addInitScript(
    (saved) => {
      localStorage.setItem("anno-modeler:v1", saved);
    },
    JSON.stringify({ state: { ...plan, autoArrange: false }, version: 1 }),
  );
  await page.goto("/");
  await expect(page.getByText("Goods balance")).toBeVisible();
  await page.getByRole("button", { name: "Arrange", exact: true }).click();
}

export const node = (page: Page, title: string) =>
  page.locator(".react-flow__node", { hasText: title });

/** Clicks a node's title, which selects it. */
export const selectNode = (page: Page, title: string) =>
  node(page, title).locator("[data-slot=card-title]").first().click();

// Fails a test on uncaught errors or console errors.
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
