import { test, expect } from "@playwright/test";

test("combat effects follow real healing and guard events, remain bounded and clear on retreat", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  const result = await page.evaluate(() => {
    const { game } = window.__camp;
    game.renderer.setPixelRatio(0.5);
    game.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    const combat = game.combat;
    game.hero.position.set(-18, 0, 13);
    const eira = game.companions.find((a) => a.userData.companionId === "Eira");
    const bram = game.companions.find((a) => a.userData.companionId === "Bram");
    eira.position.set(-17, 0, 13);
    bram.position.set(-16, 0, 13);
    combat.allies.find((a) => a.id === "Bram").hp = 20;
    game.hold = true;
    game.update(0.03, 0, false);
    const heal = game.effects.root.children.find(
      (o) => o.visible && o.userData.kind === "heal",
    );
    const healing = {
      found: !!heal,
      x: heal?.position.x,
      z: heal?.position.z,
      hp: combat.allies.find((a) => a.id === "Bram").hp,
      casting: eira.userData.swing > 0,
      beam: game.effects.root.children.some(
        (o) => o.visible && o.userData.kind === "healBolt",
      ),
    };
    const guarded = combat.defend();
    const ward = game.effects.root.children.find(
      (o) => o.visible && o.userData.kind === "ward",
    );
    game.hero.position.x -= 1;
    game.effects.update(0.1);
    const following = ward?.position.x === game.hero.position.x;
    for (let i = 0; i < 150; i++)
      game.combatVisual({ type: "swing", id: "hero", cleave: true });
    const allocated = game.effects.allocatedCount;
    game.effects.update(10);
    const expired = game.effects.activeCount;
    game.combatVisual({ type: "swing", id: "hero" });
    game.hero.position.set(combat.enemies[0].x, 0, combat.enemies[0].z + 1);
    combat.enemies[0].hp = 1;
    combat.select(combat.enemies[0].id);
    game.update(0.03, 1, false);
    for (let i = 0; i < 15; i++) game.update(0.05, 1 + i * 0.05, false);
    const corpse = game.enemyModels.get(combat.enemies[0].id);
    const collapsing =
      combat.enemies[0].hp === 0 &&
      corpse.visible &&
      corpse.userData.sprite.material.opacity < 1;
    for (let i = 0; i < 30; i++) game.update(0.05, 2 + i * 0.05, false);
    const gone = !corpse.visible;
    game.setZone("camp");
    return {
      healing,
      guarded,
      following,
      allocated,
      expired,
      afterRetreat: game.effects.activeCount,
      collapsing,
      gone,
    };
  });
  expect(result.healing).toMatchObject({ found: true, x: -16, z: 13 });
  expect(result.healing.hp).toBeGreaterThan(20);
  expect(result.healing.casting).toBe(true);
  expect(result.healing.beam).toBe(true);
  expect(result.guarded).toBe(true);
  expect(result.following).toBe(true);
  expect(result.allocated).toBeLessThanOrEqual(64);
  expect(result.expired).toBe(0);
  expect(result.afterRetreat).toBe(0);
  expect(result.collapsing).toBe(true);
  expect(result.gone).toBe(true);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Reduce combat effects", exact: true })
    .click();
  expect(await page.evaluate(() => window.__camp.game.reducedEffects)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Toggle sound", exact: true }).click();
  await page.keyboard.press("1");
  await page.getByRole("button", { name: "Toggle sound", exact: true }).click();
  expect(errors).toEqual([]);
});
