import { test, expect } from "@playwright/test";

test("walk and sword/axe attacks render separate poses, including held companion recovery", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(
    () => window.__camp?.game.hero.userData.animationMaps.axe.image?.complete,
  );
  const result = await page.evaluate(() => {
    const { game } = window.__camp;
    game.renderer.setPixelRatio(0.5);
    game.renderer.shadowMap.enabled = false;
    const hero = game.hero,
      d = hero.userData;
    const render = () => game.renderer.render(game.scene, game.camera);
    window.__camp.moveTo(-5, 5);
    const rows = new Set();
    for (let i = 0; i < 12; i++) {
      game.update(0.05, i * 0.05, false);
      render();
      if (d.activeClip === "walk") rows.add(d.activeRow);
    }
    game.stop();
    game.update(0.01, 1, false);
    render();
    const idle = d.activeClip;
    const attack = (weapon) => {
      game.setEquipment({ weapon: { itemId: weapon } });
      game.animateAttack("hero");
      game.update(0.05, 2, false);
      render();
      const windup = {
        row: d.activeRow,
        clip: d.activeClip,
        map: d.sprite.material.map === d.animationMaps[d.motionKey],
      };
      game.update(0.25, 2.25, false);
      render();
      return { windup, strike: d.activeRow, key: d.motionKey };
    };
    const sword = attack("worn_sword"),
      axe = attack("iron_axe");
    game.hold = true;
    game.animateAttack("Bram");
    for (let i = 0; i < 15; i++) game.update(0.05, 3 + i * 0.05, false);
    const bram = game.companions.find((c) => c.userData.companionId === "Bram");
    const heldSwing = bram.userData.swing,
      heldMoving = bram.userData.moving;
    window.__camp.enterMoor();
    game.hero.position.set(-8, 0, 4.6);
    game.hold = true;
    game.updateCamera(1);
    const monster = game.enemyModels.get("fallen-1"),
      monsterRows = new Set();
    for (let i = 0; i < 40; i++) {
      game.update(0.05, 4 + i * 0.05, false);
      render();
      if (monster.userData.activeClip === "attack")
        monsterRows.add(monster.userData.activeRow);
    }
    return {
      rows: [...rows].sort(),
      idle,
      sword,
      axe,
      heldSwing,
      heldMoving,
      monsterRows: [...monsterRows].sort(),
    };
  });
  expect(result.rows).toEqual([0, 1]);
  expect(result.idle).toBe("idle");
  for (const attack of [result.sword, result.axe]) {
    expect(attack.windup).toEqual({ row: 2, clip: "attack", map: true });
    expect(attack.strike).toBe(3);
  }
  expect(result.sword.key).toBe("sword");
  expect(result.axe.key).toBe("axe");
  expect(result.heldSwing).toBe(0);
  expect(result.heldMoving).toBe(false);
  expect(result.monsterRows).toEqual([0, 1]);
  await page.keyboard.press("i");
  await page
    .getByRole("button", { name: "Turn character", exact: true })
    .click();
  await page.getByRole("button", { name: "Walk", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Walk", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Attack", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Attack", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});
