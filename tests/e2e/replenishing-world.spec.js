import { test, expect } from "@playwright/test";

test("collected enemies respawn offscreen with fresh rewards while quest bosses stay defeated through reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem("emberfall-camp-v1"))
      localStorage.setItem(
        "emberfall-camp-v1",
        JSON.stringify({
          version: 2,
          defeated: ["brute"],
          lootTaken: ["brute"],
        }),
      );
  });
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  const result = await page.evaluate(() => {
    const { game: g, enterMoor, getState } = window.__camp;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    enterMoor();
    g.stop();
    g.companions.forEach((a) => (a.visible = false));
    const c = g.combat,
      e = c.enemies[0];
    const others = c.enemies.filter((a) => a !== e);
    others.forEach((a) => (a.hp = 0));
    e.hp = 1;
    g.hero.position.set(e.x, 0, e.z + 1);
    for (let i = 0; i < 30; i++) g.update(1 / 30, i / 30, false);
    const first = getState();
    const uid = first.inventory[0]?.uid;
    g.hero.position.set(35, 0, 30);
    const positions = [{ id: "hero", x: 35, z: 30, active: true }];
    c.tick(88, positions);
    const waiting = e.hp;
    c.tick(3, positions);
    g.update(1 / 30, 92, false);
    const fresh = e.hp;
    const opacity = g.enemyModels.get(e.id).userData.sprite.material.opacity;
    e.hp = 1;
    g.hero.position.set(e.x, 0, e.z + 1);
    for (let i = 0; i < 30; i++) g.update(1 / 30, 93 + i / 30, false);
    return {
      waiting,
      fresh,
      max: e.maxHp,
      opacity,
      uid,
      first,
      second: getState(),
      boss: c.enemies.find((e) => e.id === "brute").hp,
    };
  });
  expect(result.waiting).toBe(0);
  expect(result.fresh).toBe(result.max);
  expect(result.opacity).toBe(1);
  expect(result.boss).toBe(0);
  expect(result.second.xp).toBeGreaterThan(result.first.xp);
  expect(result.second.inventory.map((i) => i.uid)).toContain(result.uid);
  expect(new Set(result.second.inventory.map((i) => i.uid)).size).toBe(
    result.second.inventory.length,
  );
  expect(result.second.spawnCounts["fallen-1"]).toBe(1);
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  expect(
    (await page.evaluate(() => window.__camp.getState())).questKills,
  ).toContain("fallen-1");
  await page.evaluate(() => window.__camp.enterMoor());
  expect(
    await page.evaluate(
      () => window.__camp.getCombat().enemies.find((e) => e.id === "brute").hp,
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
});

test("boss hunting ledger, expanded spawns and their trophies remain usable on a phone", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => window.__camp.interact("Blood Moor"));
  await expect(page.locator(".hunt-card")).toHaveCount(6);
  await expect(page.locator(".respawn-note")).toContainText(
    "Quest bosses stay defeated",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Enter the Blood Moor", exact: true })
    .click();
  const result = await page.evaluate(() => {
    const g = window.__camp.game;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    g.update(1 / 30, 0, false);
    return {
      bosses: g.combat.enemies.filter((e) => e.boss).length,
      blocked: g.combat.enemies
        .filter((e) => g.blocked(e.x, e.z))
        .map((e) => e.id),
    };
  });
  expect(result.bosses).toBe(6);
  expect(result.blocked).toEqual([]);
  expect(errors).toEqual([]);
});

test("a boss telegraph keeps its facing through a close sidestep and shows the punish window", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const g = window.__camp.game;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    g.stop();
    g.companions.forEach((a) => (a.visible = false));
    g.combat.enemies.forEach((e) => (e.hp = 0));
    const boss = g.combat.enemies.find((e) => e.id === "graves-10");
    Object.assign(boss, { hp: boss.maxHp, x: -6, z: 3, navigationReady: true });
    g.hero.position.set(-6, 0, 4.4);
    g.combat.tick(0.01, [{ id: "hero", x: -6, z: 4.4, active: true }]);
    g.update(0, 0, false);
    g.update(0, 0, false);
    g.updateCamera(1);
    g.hoveredEnemy = boss.id;
    document.querySelector("dialog").showModal();
  });
  const hud = page.locator("#target-info");
  await expect(hud).toContainText("Committed strike → You");
  await expect(hud).not.toContainText("Unaware");
  expect(
    await page.evaluate(
      () =>
        window.__camp.game.enemyModels.get("graves-10").userData.attackTell
          .visible,
    ),
  ).toBe(true);
  const result = await page.evaluate(() => {
    const g = window.__camp.game,
      c = g.combat,
      enemy = c.enemies.find((e) => e.id === "graves-10"),
      before = c.allies[0].hp;
    g.hero.position.set(-4.6, 0, 3);
    c.tick(0.96, [{ id: "hero", x: -4.6, z: 3, active: true }]);
    g.update(0, 1, false);
    return {
      before,
      after: c.allies[0].hp,
      recovery: enemy.recovery,
      facing: g.enemyModels.get(enemy.id).rotation.y,
      tell: g.enemyModels.get(enemy.id).userData.attackTell.visible,
    };
  });
  expect(result.after).toBe(result.before);
  expect(result.recovery).toBeGreaterThan(0);
  expect(result.facing).toBeCloseTo(0);
  expect(result.tell).toBe(false);
  await expect(hud).toContainText("Recovering · strike now");
  expect(errors).toEqual([]);
});
