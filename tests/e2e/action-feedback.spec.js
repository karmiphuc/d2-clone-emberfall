import { test, expect } from "@playwright/test";

test("Guard duration and cooldown are visible and Cleave can queue behind an autoattack", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const { game } = window.__camp;
    game.renderer.setPixelRatio(0.5);
    game.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    game.hero.position.set(-18, 0, 13);
    game.update(0.03, 0, false);
    window.__camp.action("guard");
  });
  await expect(page.locator('[data-action="guard"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#combat-status")).toContainText("Guard active");
  await page.evaluate(() => {
    const { game } = window.__camp;
    for (let i = 0; i < 65; i++) game.update(0.05, i * 0.05, false);
  });
  await expect(page.locator('[data-action="guard"]')).toHaveClass(/cooling/);
  await expect(page.locator('[data-action="guard"] .slot-state')).toHaveText(
    /[1-5]s/,
  );
  const result = await page.evaluate(() => {
    const { game } = window.__camp,
      c = game.combat;
    game.hero.position.set(c.enemies[0].x, 0, c.enemies[0].z + 1);
    c.select(c.enemies[0].id);
    game.update(0.03, 4, false);
    window.__camp.action("attack");
    const queued = c.cleaveQueued,
      mana = c.mana;
    for (let i = 0; i < 20; i++) game.update(0.05, 4 + i * 0.05, false);
    return { queued, executed: !c.cleaveQueued, spent: mana - c.mana };
  });
  expect(result.queued).toBe(true);
  expect(result.executed).toBe(true);
  expect(result.spent).toBeGreaterThan(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__camp.action("hold"));
  await expect(page.locator("#combat-status")).toContainText("Company holding");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
