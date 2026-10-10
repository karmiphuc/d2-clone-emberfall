import { test, expect } from "@playwright/test";

test("explore the Den, clear its chambers, preserve loot and claim its reward once", async ({
  page,
}) => {
  test.setTimeout(150000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // A level-three party represents finishing the first Moor expedition.
  await page.addInitScript(() => {
    if (!localStorage.getItem("emberfall-camp-v1"))
      localStorage.setItem(
        "emberfall-camp-v1",
        JSON.stringify({
          version: 2,
          xp: 320,
          gold: 300,
          potions: 8,
          skills: { vitality: 2, mastery: 2 },
          roster: ["Ilyra", "Bram", "Eira"],
        }),
      );
  });
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const { game, enterMoor } = window.__camp;
    game.renderer.setPixelRatio(0.5);
    game.renderer.shadowMap.enabled = false;
    enterMoor();
    // Approach the physical entrance through the normal pathfinder.
    window.__camp.moveTo(15, -10);
    for (let i = 0; i < 1000; i++) game.update(1 / 30, i / 30, false);
  });
  await page
    .getByRole("button", { name: "Den of Evil · Enter", exact: true })
    .click();
  await expect(page.locator(".place h1")).toHaveText("Den of Evil");
  await page.keyboard.press("j");
  await expect(
    page.getByRole("heading", { name: "Den of Evil", exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  const result = await page.evaluate(() => {
    const { game, getCombat, action } = window.__camp,
      c = getCombat();
    const moorBefore = window.__camp.getState().defeated;
    let ticks = 0;
    const advance = () => {
      game.update(1 / 30, ticks++ / 30, false);
      if (c.allies[0].hp < c.allies[0].maxHp * 0.6) action("heal");
    };
    for (let n = 0; n < 11; n++) {
      const enemy = c.enemies
        .filter((e) => e.hp > 0)
        .sort(
          (a, b) =>
            Math.hypot(a.x - game.hero.position.x, a.z - game.hero.position.z) -
            Math.hypot(b.x - game.hero.position.x, b.z - game.hero.position.z),
        )[0];
      if (!enemy) break;
      c.select(enemy.id);
      for (let i = 0; i < 1500 && enemy.hp > 0 && !c.dead; i++) {
        advance();
        if (i % 30 === 0) c.cleave();
      }
      if (c.dead) break;
    }
    c.cancel();
    return {
      alive: !c.dead,
      state: window.__camp.getState(),
      moorBefore,
      remaining: c.enemies.filter((e) => e.hp > 0),
      ticks,
    };
  });
  expect(result.alive, JSON.stringify(result)).toBe(true);
  expect(result.state.den.defeated, JSON.stringify(result)).toHaveLength(11);
  expect(result.state.defeated).toEqual(result.moorBefore);
  await page.screenshot({ path: "test-results/den-cleared.png" });
  // Retreat and reload before collecting all loot: area drop persistence matters.
  await page
    .getByRole("button", { name: "Return to camp [6]", exact: true })
    .click();
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  expect((await page.evaluate(() => window.__camp.getState())).den).toEqual(
    result.state.den,
  );
  await page.evaluate(() => window.__camp.enterDen());
  const loot = await page.evaluate(() => {
    const { game, getCombat, moveTo } = window.__camp,
      c = getCombat();
    game.renderer.setPixelRatio(0.5);
    let ticks = 0;
    for (const drop of [...c.drops]) {
      moveTo(drop.x, drop.z);
      for (let i = 0; i < 1800 && c.drops.some((d) => d.id === drop.id); i++)
        game.update(1 / 30, ticks++ / 30, false);
    }
    return window.__camp.getState();
  });
  expect(loot.den.lootTaken).toHaveLength(11);
  await page.evaluate(() => {
    window.__camp.moveTo(-14, 10);
    for (let i = 0; i < 1800; i++)
      window.__camp.game.update(1 / 30, i / 30, false);
  });
  await page
    .getByRole("button", { name: "Blood Moor · Exit", exact: true })
    .click();
  await expect(page.locator(".place h1")).toHaveText("Blood Moor");
  await page
    .getByRole("button", { name: "Return to camp [6]", exact: true })
    .click();
  await page.evaluate(() => window.__camp.interact("Akara"));
  await page
    .getByRole("button", {
      name: "Claim Den reward · 175 gold + 3 potions",
      exact: true,
    })
    .click();
  const claimed = await page.evaluate(() => window.__camp.getState());
  expect(claimed.den.rewardClaimed).toBe(true);
  expect(claimed.gold).toBe(loot.gold + 175);
  await page.evaluate(() => window.__camp.interact("Akara"));
  await expect(
    page.getByRole("button", {
      name: "Claim Den reward · 175 gold + 3 potions",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
