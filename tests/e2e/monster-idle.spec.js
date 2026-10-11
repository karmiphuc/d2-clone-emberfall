import { test, expect } from "@playwright/test";

test("unengaged monsters hold a stable idle between deliberate patrol walks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    requestAnimationFrame = () => 0;
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const g = window.__camp.game;
    g.stop();
    window.__camp.enterMoor();
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    g.companions.forEach((a) => {
      a.visible = false;
    });
    g.hero.position.set(-28, 0, 18);
    g.combat.enemies.forEach((e) => {
      if (!e.id.startsWith("thicket-")) e.hp = 0;
    });
    g.camera.position.set(1, 36, 36);
    g.camera.lookAt(-29, 1, -6);
    g.camera.updateMatrixWorld();
  });
  await page.waitForFunction(
    () =>
      [...window.__camp.game.enemyModels.values()].every(
        (a) => a.userData.riggedMaps.monsters.map.image?.complete,
      ),
    undefined,
    { polling: 100 },
  );
  const result = await page.evaluate(() => {
    const g = window.__camp.game;
    const enemies = g.combat.enemies.filter((e) => e.id.startsWith("thicket-"));
    const traces = Object.fromEntries(enemies.map((e) => [e.id, []]));
    for (let tick = 0; tick < 240; tick++) {
      g.update(1 / 30, tick / 30, false);
      g.present(0.5, 1 / 60);
      g.renderer.render(g.scene, g.camera);
      for (const e of enemies) {
        const d = g.enemyModels.get(e.id).userData;
        traces[e.id].push({
          clip: d.riggedClip,
          row: d.sequenceFrame,
          facing: d.riggedFacing,
          frame: d.packedFrame,
          engaged: e.engaged,
        });
      }
    }
    return traces;
  });
  for (const [id, trace] of Object.entries(result)) {
    const runs = [];
    for (const frame of trace) {
      expect(frame.engaged, id).toBe(false);
      expect(["idle", "walk"], id).toContain(frame.clip);
      if (runs.at(-1)?.clip === frame.clip) runs.at(-1).frames.push(frame);
      else runs.push({ clip: frame.clip, frames: [frame] });
    }
    expect(runs.length, id).toBeLessThan(12);
    const idleRuns = runs.filter((r) => r.clip === "idle");
    expect(idleRuns.length, id).toBeGreaterThan(0);
    for (const run of idleRuns) {
      // The first interpolated render can finish the incoming turn. The rest
      // must retain one facing and exact packed rectangle throughout the pause.
      const settled = run.frames.slice(2);
      if (settled.length) {
        expect(
          new Set(settled.map((f) => JSON.stringify(f.frame))).size,
          id,
        ).toBe(1);
        expect(
          settled.every((f) => f.row === 0),
          id,
        ).toBe(true);
      }
    }
  }
});
