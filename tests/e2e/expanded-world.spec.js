import { test, expect } from "@playwright/test";

test("expanded wilderness routes to distant regions and map clicks issue real walking orders on desktop and phone", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const g = window.__camp.game;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    const before = g.residents.map((r) => r.actor.position.clone());
    for (let i = 0; i < 90; i++) g.update(1 / 30, i / 30, false);
    if (
      g.residents.length !== 6 ||
      !g.residents.some((r, i) => r.actor.position.distanceTo(before[i]) > 0.2)
    )
      throw Error("Camp residents did not walk");
    window.__camp.enterMoor();
    g.stop();
  });
  const result = await page.evaluate(() => {
    const g = window.__camp.game,
      c = window.__camp.getCombat();
    const destinations = [
      [-30, 18],
      [-32, -4],
      [-29, -23],
      [-10, -26],
      [11, -26],
      [31, -23],
      [31, -5],
      [29, 18],
      [9, 25],
      [-10, 25],
    ];
    return {
      enemies: c.enemies.length,
      paths: destinations.map(([x, z]) => {
        const route = g.route({ x: -13, z: 9 }, { x, z });
        return {
          length: route.length,
          end: route.at(-1),
          valid: route.every((p) => !g.blocked(p.x, p.z)),
        };
      }),
    };
  });
  expect(result.enemies).toBe(72);
  for (const route of result.paths) {
    expect(route.length).toBeGreaterThan(5);
    expect(route.valid).toBe(true);
  }
  await page.getByRole("button", { name: "Area map", exact: true }).click();
  await expect(page.locator(".minimap")).toHaveClass(/map-open/);
  const map = page.locator("#map");
  let rect = await map.boundingBox();
  await map.click({
    position: { x: rect.width * 0.81, y: rect.height * 0.34 },
  });
  await expect(page.locator(".minimap")).not.toHaveClass(/map-open/);
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.path.at(-1)?.x),
  ).toBeGreaterThan(20);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Area map", exact: true }).click();
  await expect(map).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "3. Old Burial Ground", exact: true })
    .click();
  await expect(page.locator(".minimap")).not.toHaveClass(/map-open/);
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.path.at(-1)?.z),
  ).toBeLessThan(-20);
  await page.getByRole("button", { name: "Area map", exact: true }).click();
  await page.evaluate(() => window.__camp.returnToCamp());
  await expect(page.locator(".minimap")).toHaveAttribute("data-zone", "camp");
  await expect(
    page.getByRole("button", { name: "3. Old Burial Ground", exact: true }),
  ).toBeHidden();
  expect(errors).toEqual([]);
});

test("outer packs patrol, fight, drop loot and persist beyond the old bounds", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  const result = await page.evaluate(() => {
    const { game: g, getCombat, enterMoor, getState } = window.__camp;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    enterMoor();
    g.stop();
    const c = getCombat(),
      enemy = c.enemies.find((e) => e.id === "westfield-1");
    const before = { x: enemy.x, z: enemy.z };
    for (let i = 0; i < 60; i++) g.update(1 / 30, i / 30, false);
    const patrolled = Math.hypot(enemy.x - before.x, enemy.z - before.z) > 0.05;
    // Fight one outer creature through actual contact/damage events in isolation.
    for (const e of c.enemies)
      if (e !== enemy) {
        e.x = 40;
        e.z = -32;
      }
    g.hero.position.set(enemy.x, 0, enemy.z + 1.2);
    g.companions.forEach((o) => (o.visible = false));
    enemy.hp = 8;
    for (let i = 0; i < 60 && enemy.hp > 0; i++)
      g.update(1 / 30, (60 + i) / 30, false);
    const state = getState();
    return {
      patrolled,
      killed: state.defeated.includes(enemy.id),
      looted: state.lootTaken.includes(enemy.id),
      xp: state.xp,
      gold: state.gold,
    };
  });
  expect(result.patrolled).toBe(true);
  expect(result.killed).toBe(true);
  expect(result.looted).toBe(true);
  expect(result.xp).toBeGreaterThan(0);
  expect(result.gold).toBeGreaterThan(240);
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  expect(
    await page.evaluate(() => window.__camp.getState().defeated),
  ).toContain("westfield-1");
});
