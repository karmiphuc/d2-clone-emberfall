import { test, expect } from "@playwright/test";

test("the first area supports repeat hunts to level six, gear, skill trees and all companion roles", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    window.__camp.game.renderer.setPixelRatio(0.5);
    window.__camp.game.renderer.shadowMap.enabled = false;
    window.__camp.showSkills();
  });
  await expect(
    page.getByRole("button", { name: "Learn Wide Arc", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Learn Weapon Mastery", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Learn Vitality", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  const clear = () =>
    page.evaluate(() => {
      const { game, getCombat, action } = window.__camp,
        c = getCombat();
      let ticks = 0;
      const advance = () => {
        game.update(1 / 30, ticks++ / 30, false);
        if (c.allies[0].hp < c.allies[0].maxHp * 0.6 && c.allies[0].hp > 0)
          action("heal");
      };
      const distance = (e) =>
        Math.hypot(game.hero.position.x - e.x, game.hero.position.z - e.z);
      for (let n = 0; n < 12; n++) {
        const enemy = c.enemies
          .filter((e) => e.hp > 0)
          .sort((a, b) => distance(a) - distance(b))[0];
        if (!enemy) break;
        c.select(enemy.id);
        for (let i = 0; i < 1000 && enemy.hp > 0 && !c.dead; i++) {
          advance();
          if (i % 30 === 0) c.cleave();
        }
        if (c.dead) break;
      }
      c.cancel();
      for (const d of [...c.drops]) {
        window.__camp.moveTo(d.x, d.z);
        for (
          let i = 0;
          i < 600 && c.drops.some((x) => x.id === d.id) && !c.dead;
          i++
        )
          advance();
      }
      return {
        state: window.__camp.getState(),
        alive: !c.dead,
        level: c.stats.level,
        health: c.allies[0].hp,
      };
    });
  await page.evaluate(() => window.__camp.enterMoor());
  let result = await clear();
  expect(result.alive, JSON.stringify(result)).toBe(true);
  expect(result.state.defeated).toHaveLength(12);
  expect(result.level).toBe(3);
  expect(result.state.inventory.length).toBeGreaterThanOrEqual(10);
  await page.evaluate(() => {
    window.__camp.returnToCamp();
    window.__camp.showInventory();
  });
  await page.locator("[data-equip]:not([disabled])").first().click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.evaluate(() => window.__camp.showSkills());
  await page
    .getByRole("button", { name: "Learn Wide Arc", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset talents · Free in camp", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Learn Vitality", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.evaluate(() => window.__camp.showParty());
  await expect(
    page.getByRole("button", { name: "Recruit Soren · Mage", exact: true }),
  ).toBeDisabled();
  for (const id of ["Ilyra", "Bram", "Eira"])
    await page
      .getByRole("button", { name: new RegExp(`^Dismiss ${id} ·`) })
      .click();
  for (const id of ["Soren", "Aldric", "Nyx"])
    await page
      .getByRole("button", { name: new RegExp(`^Recruit ${id} ·`) })
      .click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  expect(await page.locator(".party-card").count()).toBe(4);
  for (let hunt = 1; hunt < 4; hunt++) {
    await page.evaluate(() => window.__camp.interact("Blood Moor"));
    await page
      .getByRole("button", { name: "Start fresh hunt", exact: true })
      .click();
    result = await clear();
    expect(result.alive, JSON.stringify(result)).toBe(true);
    expect(result.state.defeated, JSON.stringify(result)).toHaveLength(12);
    expect(result.state.lootTaken).toHaveLength(12);
    await page.evaluate(() => window.__camp.returnToCamp());
  }
  expect(result.level).toBe(6);
  expect(result.state.run).toBe(3);
  expect(
    new Set(result.state.inventory.map((i) => i.itemId)).size,
  ).toBeGreaterThan(10);
  const saved = await page.evaluate(() => window.__camp.getState());
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  expect(await page.evaluate(() => window.__camp.getState())).toEqual(saved);
  await page.evaluate(() => window.__camp.showSkills());
  await page.screenshot({ path: "test-results/skill-trees.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
