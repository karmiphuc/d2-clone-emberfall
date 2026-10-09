import { test, expect } from "@playwright/test";

test("complete a party expedition, collect loot, claim once and preserve progress", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const g = window.__camp.game;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    window.__camp.interact("Blood Moor");
  });
  await page
    .getByRole("button", { name: "Enter the Blood Moor", exact: true })
    .click();
  await expect(page.locator(".place h1")).toHaveText("Blood Moor");
  const result = await page.evaluate(() => {
    const { game, getCombat, action } = window.__camp,
      c = getCombat();
    let ticks = 0;
    const advance = () => {
      game.update(1 / 30, ticks++ / 30, false);
      if (c.allies[0].hp < 70 && c.allies[0].hp > 0) action("heal");
    };
    const distance = (e) =>
      Math.hypot(game.hero.position.x - e.x, game.hero.position.z - e.z);
    for (let encounters = 0; encounters < 12; encounters++) {
      const target = c.enemies
        .filter((e) => e.hp > 0)
        .sort((a, b) => distance(a) - distance(b))[0];
      if (!target) break;
      c.select(target.id);
      for (let i = 0; i < 900 && target.hp > 0 && !c.dead; i++) {
        advance();
        if (i % 30 === 0) c.cleave();
      }
      if (c.dead) break;
    }
    c.cancel();
    for (const drop of [...c.drops]) {
      window.__camp.moveTo(drop.x, drop.z);
      for (
        let i = 0;
        i < 600 && c.drops.some((d) => d.id === drop.id) && !c.dead;
        i++
      )
        advance();
    }
    return {
      state: window.__camp.getState(),
      alive: c.allies[0].hp > 0,
      remaining: c.enemies
        .filter((e) => e.hp > 0)
        .map((e) => ({ id: e.id, hp: e.hp })),
      ticks,
    };
  });
  expect(result.alive, JSON.stringify(result)).toBe(true);
  expect(result.state.defeated, JSON.stringify(result)).toHaveLength(12);
  expect(result.state.lootTaken).toHaveLength(12);
  expect(result.state.charm).toBe(true);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/blood-moor.png" });
  await page
    .getByRole("button", { name: "Return to camp [6]", exact: true })
    .click();
  await expect(page.locator(".place h1")).toHaveText("Rogue Encampment");
  await page.evaluate(() => window.__camp.interact("Akara"));
  await page
    .getByRole("button", { name: "Claim reward · 100 gold + 2 potions" })
    .click();
  const claimed = await page.evaluate(() => window.__camp.getState());
  expect(claimed.rewardClaimed).toBe(true);
  expect(claimed.gold).toBe(result.state.gold + 100);
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  expect(await page.evaluate(() => window.__camp.getState())).toEqual(claimed);
  await page.evaluate(() => window.__camp.interact("Akara"));
  await expect(
    page.getByRole("button", { name: "Claim reward · 100 gold + 2 potions" }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("hero defeat restores the party in camp with the advertised gold penalty", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const { game, enterMoor, getCombat } = window.__camp;
    game.renderer.setPixelRatio(0.5);
    game.renderer.shadowMap.enabled = false;
    enterMoor();
    const c = getCombat();
    game.hero.position.set(-8, 0, 3);
    c.allies[0].hp = 1;
    // Isolate the defeat path from companion healing or target interception.
    game.companions.forEach((o) => (o.visible = false));
    for (let i = 0; i < 30 && !c.dead; i++) game.update(1 / 30, i / 30, false);
  });
  await expect(
    page.getByRole("heading", { name: "The company retreats" }),
  ).toBeVisible();
  await expect(page.locator(".place h1")).toHaveText("Rogue Encampment");
  const result = await page.evaluate(() => ({
    state: window.__camp.getState(),
    health: window.__camp.getCombat().allies.map((a) => [a.hp, a.maxHp]),
  }));
  expect(result.state.gold).toBe(216);
  expect(result.health.every(([hp, max]) => hp === max)).toBe(true);
});
