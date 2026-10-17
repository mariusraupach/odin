import type { Page } from "@playwright/test";
import { expect, node, test } from "./fixtures";

const handle = (page: Page, nodeType: string, id: string) =>
  page
    .locator(
      `.react-flow__node-${nodeType} .react-flow__handle[data-handleid="${id}"]`,
    )
    .first();

async function dragFromPalette(page: Page, name: string, x: number, y: number) {
  const canvas = page.locator(".react-flow");
  const box = (await canvas.boundingBox())!;
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  const point = { clientX: box.x + x, clientY: box.y + y, dataTransfer };
  await page
    .locator("aside [cmdk-item]", { hasText: name })
    .first()
    .dispatchEvent("dragstart", { dataTransfer });
  await canvas.dispatchEvent("dragover", point);
  await canvas.dispatchEvent("drop", point);
}

async function connect(
  page: Page,
  from: ReturnType<typeof handle>,
  to: ReturnType<typeof handle>,
) {
  const a = (await from.boundingBox())!;
  const b = (await to.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Goods balance")).toBeVisible();
});

test("builds a chain from the palette and keeps it after a reload", async ({
  page,
}) => {
  await dragFromPalette(page, "Fishery", 150, 200);
  await dragFromPalette(page, "Farmers", 650, 200);
  await expect(page.locator(".react-flow__node")).toHaveCount(2);

  const fishOut = handle(page, "building", "out:1010200");
  await connect(page, fishOut, handle(page, "residence", "in:1010200"));
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);

  // Fish cannot go into the schnapps input.
  await connect(page, fishOut, handle(page, "residence", "in:1010216"));
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);

  // 100 houses eat 2.5 t/min, one fishery makes 2: the short edge shows its rate.
  await node(page, "Farmers").getByLabel("Number of residences").fill("100");
  await expect(page.locator(".react-flow__edgelabel-renderer")).toContainText(
    "2.00 t/min",
  );

  await page.reload();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
});
