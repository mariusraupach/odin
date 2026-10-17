import { expect, test } from "./fixtures";

test("plans a population goal on its own island", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan goal" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Houses").fill("100");
  await expect(dialog).toContainText("1,000 residents");
  await expect(dialog).toContainText("2×Fishery");
  await dialog.getByRole("button", { name: "Add to canvas" }).click();

  await expect(
    page.getByText("Added 10 buildings for 100 houses of Farmers"),
  ).toBeVisible();
  await expect(page.getByLabel("Island name")).toHaveValue("Farmers");
  await expect(page.locator(".react-flow__node-residence")).toContainText(
    "Farmers",
  );
  // Everything is sized to run at full efficiency.
  await expect(page.getByText(/% eff\./)).toHaveCount(0);
});

test("plans a good without an island", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan goal" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Good" }).click();
  await dialog.getByRole("switch").click();
  await dialog.getByRole("button", { name: "Add to canvas" }).click();
  await expect(page.locator(".react-flow__node-island")).toHaveCount(0);
  await expect(
    page.locator(".react-flow__node-building").first(),
  ).toBeVisible();
});
