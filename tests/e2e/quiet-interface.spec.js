import { test, expect } from "@playwright/test";

test("play starts quietly, menus toggle or switch, and the gate enters directly", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".quest")).toBeHidden();
  await expect(page.locator(".controls")).toBeHidden();
  await expect(page.locator(".chapter")).toBeHidden();
  await page.keyboard.press("5");
  await page.locator("#sound").click();
  await expect(page.locator("#toast")).not.toHaveClass(/visible/);
  await page.keyboard.press("i");
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "data-panel",
    "inventory",
  );
  await page.keyboard.press("j");
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "data-panel",
    "journal",
  );
  await expect(page.locator(".hunt-details")).not.toHaveAttribute("open");
  await expect(page.locator(".hunt-card").first()).toBeHidden();
  await page.locator(".hunt-details summary").click();
  await expect(page.locator(".hunt-card")).toHaveCount(6);
  await page.keyboard.press("j");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: /^Blood Moor/ })
    .evaluate((b) => b.click());
  await expect(page.locator(".place h1")).toHaveText("Blood Moor", {
    timeout: 60000,
  });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator("#toast")).not.toHaveClass(/visible/);
  await page.getByRole("button", { name: "Town [6]", exact: true }).click();
  await expect(page.locator(".place h1")).toHaveText("Rogue Encampment");
  expect(errors).toEqual([]);
});

test("optional details persist and a pending NPC visit cannot replace an open menu", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Show quest tracker", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show control reminders", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".quest")).toBeVisible();
  await expect(page.locator(".controls")).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".quest")).toBeVisible();
  await expect(page.locator(".controls")).toBeVisible();
  await page
    .locator(".npc-label")
    .filter({ hasText: "Charsi" })
    .evaluate((b) => b.click());
  await page.keyboard.press("i");
  await page.evaluate(() => {
    const g = window.__camp.game;
    g.stop();
    g.hero.position.copy(g.npcs.find((n) => n.name === "Charsi").point);
  });
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "data-panel",
    "inventory",
  );
  await page.waitForTimeout(200);
  await expect(page.getByRole("dialog")).toHaveAttribute(
    "data-panel",
    "inventory",
  );
  await page.keyboard.press("i");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
