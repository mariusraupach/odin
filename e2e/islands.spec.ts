import { expect, openPlan, selectNode, test, threeIslands } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await openPlan(page, threeIslands);
});

test("bundles goods between islands into trade routes", async ({ page }) => {
  await expect(page.locator(".trade-route")).toHaveCount(2);
  await expect(page.getByText("Trade route")).toHaveCount(2);
  await expect(
    page.locator(".react-flow__node-island", {
      has: page.locator('input[value="Crown Falls"]'),
    }),
  ).toContainText("Farmer 600/195");
});

test("shows workforce per island in the sidebar", async ({ page }) => {
  const workforce = page.locator("section", { hasText: "Workforce" }).last();
  await expect(workforce).toContainText("Crown Falls");
  await expect(workforce).toContainText("Brick Rock");
  await expect(workforce).toContainText("0 / 100");
});

test("fades everything outside the selected node's chain", async ({ page }) => {
  await selectNode(page, "Farmers");
  const dimmed = page.locator(
    ".react-flow__node.dimmed [data-slot=card-title]",
  );
  await expect(dimmed).toHaveCount(3);
  await expect(dimmed).toContainText(["Workers", "Clay Pit", "Brick Factory"]);
  await page.keyboard.press("Escape");
  await expect(dimmed).toHaveCount(0);
});

test("finds a node with ⌘K and selects it", async ({ page }) => {
  await page.keyboard.press("ControlOrMeta+k");
  await page.keyboard.type("potato");
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("[cmdk-item]")).toHaveCount(2);
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".react-flow__node.selected")).toContainText(
    "Potato Farm",
  );
});
