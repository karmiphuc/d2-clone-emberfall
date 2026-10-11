import { test, expect } from "@playwright/test";

test("Ashen Brute animates its warning into damage, recovery and death", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const result = await page.evaluate(() => {
    const g = window.__camp.game;
    g.stop();
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    g.companions.forEach((c) => (c.visible = false));
    const enemy = g.combat.enemies.find((e) => e.elite),
      model = g.enemyModels.get(enemy.id);
    g.combat.enemies.forEach((e) => {
      e.speed = 0;
      e.cooldown = 999;
      if (e !== enemy) e.hp = 0;
    });
    enemy.x = -8;
    enemy.z = 4.5;
    enemy.cooldown = 0;
    enemy.hp = enemy.maxHp = 10000;
    g.hero.position.set(-8, 0, 5.8);
    g.hero.userData.path = [];
    g.updateCamera(1);
    const records = [],
      impacts = [];
    for (let tick = 0; tick < 90; tick++) {
      const hp = g.combat.allies[0].hp;
      g.update(1 / 30, tick / 30, false);
      g.present(0.6, 1 / 60);
      g.renderer.render(g.scene, g.camera);
      const d = model.userData;
      records.push({ clip: d.riggedClip, row: d.sequenceFrame });
      if (g.combat.allies[0].hp < hp)
        impacts.push({
          clip: d.riggedClip,
          row: d.sequenceFrame,
          windup: enemy.windup,
        });
    }
    enemy.hp = 0;
    g.combatVisual({ type: "kill", id: enemy.id });
    const death = [];
    for (let tick = 0; tick < 34; tick++) {
      g.update(1 / 30, 3 + tick / 30, false);
      g.present(0.6, 1 / 60);
      g.renderer.render(g.scene, g.camera);
      death.push({
        clip: model.userData.riggedClip,
        row: model.userData.sequenceFrame,
        opacity: model.userData.sprite.material.opacity,
      });
    }
    return {
      records,
      impacts,
      death,
      name: model.userData.characterId,
      stride: model.userData.walkStrideDistance,
      expectedStride: model.userData.rigged.stride * 1.25,
    };
  });
  expect(result.name).toBe("Brute");
  expect(result.stride).toBeCloseTo(result.expectedStride, 8);
  expect(
    new Set(result.records.filter((s) => s.clip === "windup").map((s) => s.row))
      .size,
  ).toBeGreaterThan(20);
  expect(
    new Set(result.records.filter((s) => s.clip === "attack").map((s) => s.row))
      .size,
  ).toBeGreaterThan(5);
  expect(result.impacts.length).toBeGreaterThan(0);
  expect(
    result.impacts.every(
      (s) => s.clip === "attack" && s.row <= 2 && s.windup === 0,
    ),
  ).toBe(true);
  expect(result.death.every((s) => s.clip === "death")).toBe(true);
  expect(new Set(result.death.map((s) => s.row)).size).toBeGreaterThan(20);
  expect(result.death.at(-1).opacity).toBeLessThan(0.2);
  expect(errors).toEqual([]);
});

test("the Gravewarden uses its own undead rig after entering the Den", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  await page.evaluate(() => {
    window.__camp.game.stop();
    window.__camp.enterDen();
  });
  await page.waitForFunction(() =>
    [...window.__camp.game.enemyModels.values()].some(
      (a) =>
        a.userData.characterId === "Gravewarden" &&
        a.userData.riggedMaps.monsters.map.image?.complete,
    ),
  );
  const result = await page.evaluate(() => {
    const g = window.__camp.game,
      a = [...g.enemyModels.values()].find(
        (a) => a.userData.characterId === "Gravewarden",
      );
    g.renderer.setPixelRatio(0.5);
    g.updateCamera(1);
    a.visible = true;
    g.renderer.render(g.scene, g.camera);
    return {
      zone: g.zone,
      name: a.userData.characterId,
      url: a.userData.riggedMaps.monsters.map.image.src,
      frames: a.userData.gaitFrames,
      actions: Object.keys(a.userData.riggedMaps.monsters.frames.clips),
    };
  });
  expect(result.zone).toBe("den");
  expect(result.name).toBe("Gravewarden");
  expect(result.url).toContain("gravewarden.webp");
  expect(result.frames).toBe(96);
  expect(result.actions).toEqual(["idle", "walk", "attack", "windup", "death"]);
  expect(errors).toEqual([]);
});
