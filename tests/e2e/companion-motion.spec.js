import { test, expect } from "@playwright/test";

test("all six roles strike and recover with authored frames and aimed projectiles", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "networkidle" });
  const result = await page.evaluate(() => {
    const { game } = window.__camp;
    game.renderer.setPixelRatio(0.5);
    game.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    game.hold = true;
    const combat = game.combat;
    const render = () => game.renderer.render(game.scene, game.camera);
    const records = [];
    for (const actor of game.companions) {
      const id = actor.userData.companionId;
      game.effects.clear();
      game.hero.position.set(-12, 0, 7);
      game.updateCamera(1);
      game.companions.forEach((other) => {
        other.visible = other === actor;
        other.userData.swing = 0;
      });
      actor.position.set(-8, 0, 4.5);
      combat.allies.forEach((ally) => {
        ally.hp = ally.maxHp;
        ally.cooldown = 0;
        ally.specialCooldown = 100;
      });
      combat.enemies.forEach((enemy, i) => {
        enemy.x = i ? 15 : -8;
        enemy.z = i ? -13 : 3;
        enemy.hp = enemy.maxHp = 1000;
        enemy.speed = 0;
        enemy.cooldown = 100;
        enemy.windup = 0;
      });
      // One actual simulation attack, rather than calling the renderer's attack helper.
      game.update(0.02, 0, false);
      render();
      const d = actor.userData;
      const release = d.activeRow;
      const mapped =
        d.sprite.material.map === d.animationMaps[`${d.motionKey}Attack`];
      const projectiles = game.effects.root.children.filter(
        (node) =>
          node.visible &&
          ["arrow", "frostBolt", "holyBolt"].includes(node.userData.kind),
      );
      const aimed = projectiles.every((node) =>
        Number.isFinite(node.material.rotation),
      );
      const kinds = projectiles.map((node) => node.userData.kind);
      game.update(0.14, 0.14, false);
      render();
      const recovery = d.activeRow;
      game.update(0.15, 0.29, false);
      render();
      records.push({
        id,
        release,
        recovery,
        mapped,
        aimed,
        kinds,
        idle: d.activeClip,
      });
    }
    game.setZone("camp");
    return { records, remaining: game.effects.activeCount };
  });
  expect(result.records).toHaveLength(6);
  for (const [i, record] of result.records.entries()) {
    expect(record.mapped, record.id).toBe(true);
    expect(record.release, record.id).toBe((i % 3) * 2);
    expect(record.recovery, record.id).toBe((i % 3) * 2 + 1);
    expect(record.idle, record.id).toBe("idle");
    expect(record.aimed, record.id).toBe(true);
    expect(record.kinds, record.id).toEqual(
      { Ilyra: ["arrow"], Eira: ["holyBolt"], Soren: ["frostBolt"] }[
        record.id
      ] || [],
    );
  }
  expect(result.remaining).toBe(0);
  expect(errors).toEqual([]);
});
