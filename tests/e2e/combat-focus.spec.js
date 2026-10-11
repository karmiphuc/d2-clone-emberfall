import { test, expect } from "@playwright/test";

test("hover inspection preserves attack intent and health focus clears on death and camp return", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const ids = await page.evaluate(() => {
    const g = window.__camp.game;
    window.__camp.enterMoor();
    g.stop();
    g.renderer.setPixelRatio(0.5);
    g.hero.position.set(-8, 0, 6);
    const fallen = g.combat.enemies[0],
      brute = g.combat.enemies.find((e) => e.elite);
    g.combat.enemies.forEach((e) => {
      e.x = 35;
      e.z = 35;
      e.speed = 0;
      e.cooldown = 999;
    });
    Object.assign(fallen, { x: -10, z: 4 });
    Object.assign(brute, {
      x: -7,
      z: 4,
      engaged: true,
      windup: 0.475,
      victim: "hero",
      slow: 2,
    });
    g.combat.select(fallen.id);
    g.update(0, 0, false);
    g.updateCamera(1);
    document.querySelector("dialog").showModal();
    return { fallen: fallen.id, brute: brute.id };
  });
  const hud = page.locator("#target-info");
  await expect(hud).toHaveAttribute("data-enemy", ids.brute);
  await expect(hud).not.toContainText(/Committed strike|Recovering|move clear/);
  await expect(hud).toContainText("Chilled");
  await expect(hud).not.toContainText("Unaware");
  await expect(
    page.getByRole("progressbar", { name: "Creature health" }),
  ).toHaveAttribute("aria-valuenow", /\d+/);
  await expect(page.locator(".target-warning, .enemy-warning")).toHaveCount(0);
  await page.evaluate((id) => {
    window.__camp.game.hoveredEnemy = id;
  }, ids.fallen);
  await expect(hud).toHaveAttribute("data-enemy", ids.fallen);
  expect(await page.evaluate(() => window.__camp.game.combat.target)).toBe(
    ids.fallen,
  );
  await page.evaluate((id) => {
    const g = window.__camp.game;
    g.hoveredEnemy = null;
    g.combat.enemies.find((e) => e.id === id).hp = 0;
  }, ids.brute);
  await expect(hud).toHaveAttribute("data-enemy", ids.fallen);
  await expect(hud).not.toHaveClass(/winding/);
  await page.setViewportSize({ width: 390, height: 844 });
  const box = await hud.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.__camp.returnToCamp());
  await expect(hud).toBeHidden();
  expect(errors).toEqual([]);
});
