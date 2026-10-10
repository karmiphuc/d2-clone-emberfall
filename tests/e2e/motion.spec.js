import { test, expect } from "@playwright/test";

test("walk and sword/axe attacks render separate poses, including held companion recovery", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(
    () =>
      window.__camp?.game.hero.userData.animationMaps.axeStrike.image
        ?.complete &&
      window.__camp.game.hero.userData.animationMaps.sword.image?.complete,
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
    for (let i = 0; i < 24; i++) {
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
        map: d.sprite.material.map === d.animationMaps[`${d.motionKey}Strike`],
      };
      const attackRows = new Set([d.activeRow]);
      for (let i = 0; i < 24; i++) {
        game.update(0.02, 2.05 + i * 0.02, false);
        render();
        if (d.activeClip === "attack") attackRows.add(d.activeRow);
      }
      return { windup, rows: [...attackRows].sort(), key: d.motionKey };
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
  expect(result.rows.length).toBeGreaterThan(8);
  expect(result.rows.every((row) => row >= 0 && row < 48)).toBe(true);
  expect(result.idle).toBe("idle");
  for (const attack of [result.sword, result.axe]) {
    expect(attack.windup).toEqual({ row: 0, clip: "attack", map: true });
    expect(attack.rows).toEqual([0, 1, 2, 3, 4, 5]);
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

test("hero damage and impact pose share the contact beat; moving cancels anticipation", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  const result = await page.evaluate(() => {
    const { game } = window.__camp;
    game.renderer.setPixelRatio(0.5);
    game.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    game.companions.forEach((c) => (c.visible = false));
    const c = game.combat,
      enemy = c.enemies[0],
      d = game.hero.userData;
    c.enemies.forEach((e) => {
      e.cooldown = 999;
      e.speed = 0;
    });
    game.hero.position.set(enemy.x, 0, enemy.z + 1.5);
    const hp = enemy.hp;
    c.select(enemy.id);
    game.update(0.01, 0, false);
    game.update(0.07, 0.07, false);
    game.renderer.render(game.scene, game.camera);
    const anticipation = {
      damage: hp - enemy.hp,
      row: d.activeRow,
      pending: !!c.preparing,
    };
    game.update(0.05, 0.12, false);
    game.update(0.05, 0.17, false);
    game.renderer.render(game.scene, game.camera);
    const contact = {
      damage: hp - enemy.hp,
      row: d.activeRow,
      pending: !!c.preparing,
      recoil: game.enemyModels.get(enemy.id).userData.recoilTime > 0,
    };
    c.cancel();
    c.allies[0].cooldown = 0;
    c.cleave(enemy.id);
    const mana = c.mana,
      life = enemy.hp;
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS" }));
    game.update(0.04, 0.21, false);
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyS" }));
    for (let i = 0; i < 8; i++) game.update(0.04, 0.25 + i * 0.04, false);
    return {
      anticipation,
      contact,
      canceled: !c.preparing && enemy.hp === life && c.mana >= mana,
    };
  });
  expect(result.anticipation).toEqual({ damage: 0, row: 1, pending: true });
  expect(result.contact.damage).toBeGreaterThan(0);
  expect(result.contact).toMatchObject({
    row: 2,
    pending: false,
    recoil: true,
  });
  expect(result.canceled).toBe(true);
});
