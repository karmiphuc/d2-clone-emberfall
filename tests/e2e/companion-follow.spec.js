import { test, expect } from "@playwright/test";

test("every mercenary follows through turns, settles, and respects Hold with distance-driven playback", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const records = await page.evaluate(() => {
    const { game: g } = window.__camp;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    g.combat.enemies.forEach((e) => (e.hp = 0));
    const records = [];
    for (const actor of g.companions) {
      g.hero.position.set(-12, 0, 6);
      g.hero.rotation.y = Math.PI / 2;
      g.companions.forEach((c) => {
        c.visible = c === actor;
        c.userData.path = [];
      });
      actor.position.set(-14, 0, 6);
      actor.rotation.y = Math.PI / 2;
      actor.userData.follow = null;
      actor.userData.swing = 0;
      g.regroup();
      window.__camp.moveTo(-5, 6);
      let travel = 0,
        maxTurn = 0,
        falseIdle = 0,
        movingTicks = 0;
      for (let tick = 0; tick < 900; tick++) {
        if (tick === 130) window.__camp.moveTo(-10, 4);
        const before = actor.position.clone(),
          yaw = actor.rotation.y;
        g.update(1 / 60, tick / 60, false);
        const distance = actor.position.distanceTo(before);
        travel += distance;
        maxTurn = Math.max(
          maxTurn,
          Math.abs(
            Math.atan2(
              Math.sin(actor.rotation.y - yaw),
              Math.cos(actor.rotation.y - yaw),
            ),
          ),
        );
        if (distance > 1e-7) {
          movingTicks++;
          if (!actor.userData.moving) falseIdle++;
          g.present(0.5, 1 / 120);
        }
      }
      g.renderer.render(g.scene, g.camera);
      const idle = !actor.userData.moving;
      const settled = actor.position.clone();
      for (let tick = 0; tick < 120; tick++)
        g.update(1 / 60, 15 + tick / 60, false);
      const drift = actor.position.distanceTo(settled);
      g.hold = true;
      window.__camp.moveTo(-5, 6);
      for (let tick = 0; tick < 120; tick++)
        g.update(1 / 60, 17 + tick / 60, false);
      const heldTravel = actor.position.distanceTo(settled);
      g.hold = false;
      const d = actor.userData;
      d.moving = true;
      d.swing = d.renderSwing = 0;
      d.phase = d.renderPhase = 12.5;
      g.renderer.render(g.scene, g.camera);
      g.renderer.render(g.scene, g.camera);
      const atlasRow = d.activeRow,
        sequenceLength = d.sequenceLength;
      d.moving = false;
      records.push({
        id: actor.userData.companionId,
        travel,
        movingTicks,
        falseIdle,
        maxTurn,
        idle,
        drift,
        heldTravel,
        gaitFrames: actor.userData.gaitFrames,
        atlasRow,
        sequenceLength,
      });
    }
    g.setZone("camp");
    return records;
  });
  expect(records).toHaveLength(6);
  for (const [index, r] of records.entries()) {
    expect(r.travel, r.id).toBeGreaterThan(8);
    expect(r.movingTicks, r.id).toBeGreaterThan(100);
    expect(r.falseIdle, r.id).toBe(0);
    expect(r.maxTurn, r.id).toBeLessThanOrEqual(0.10001);
    expect(r.idle, r.id).toBe(true);
    expect(r.drift, r.id).toBeLessThan(0.001);
    expect(r.heldTravel, r.id).toBeLessThan(0.001);
    expect(r.gaitFrames, r.id).toBe(24);
    expect(r.sequenceLength, r.id).toBe(24);
    expect(r.atlasRow, r.id).toBe((index % 3) * 24 + 12);
  }
});
