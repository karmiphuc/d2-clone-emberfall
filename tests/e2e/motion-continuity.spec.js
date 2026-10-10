import { test, expect } from "@playwright/test";

test("intermediate route nodes never insert an idle sprite and consume the travel budget", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const samples = await page.evaluate(() => {
    const g = window.__camp.game,
      d = g.hero.userData;
    g.renderer.setPixelRatio(0.5);
    g.stop();
    g.companions.forEach((c) => (c.visible = false));
    g.hero.position.set(0, 0, 5);
    d.previousPosition.copy(g.hero.position);
    d.swing = d.renderSwing = 0;
    d.motionWasMoving = false;
    d.path = [0.12, 0.25, 0.5, 0.75, 1].map((x) =>
      g.hero.position.clone().set(x, 0, 5),
    );
    const samples = [];
    for (let i = 0; i < 10; i++) {
      const before = g.hero.position.x;
      g.update(1 / 30, i / 30, false);
      g.present(0.5, 1 / 60);
      g.renderer.render(g.scene, g.camera);
      samples.push({
        advance: g.hero.position.x - before,
        x: g.hero.position.x,
        clip: d.activeClip,
        phase: d.renderPhase,
        bank: d.displayVariant,
        remaining: d.path.length,
      });
    }
    return samples;
  });
  expect(
    samples.filter((s) => s.advance > 1e-8).every((s) => s.clip === "walk"),
  ).toBe(true);
  expect(
    samples
      .filter((s) => s.remaining > 0)
      .every((s) => Math.abs(s.advance - 4 / 30) < 1e-7),
  ).toBe(true);
  expect(samples.at(-1).x).toBeCloseTo(1, 8);
  expect(samples.at(-1).clip).toBe("idle");
});

test("attack entry and recovery use one display clock without wrong-atlas or backwards frames", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const result = await page.evaluate(() => {
    const g = window.__camp.game,
      d = g.hero.userData;
    g.renderer.setPixelRatio(0.5);
    g.stop();
    d.swing = 0;
    d.previousSwing = 0;
    d.moving = false;
    g.animateAttack("hero");
    const entry = [];
    for (const alpha of [0, 0.25, 0.5, 0.75, 1]) {
      g.present(alpha, 1 / 120);
      g.renderer.render(g.scene, g.camera);
      entry.push(d.sequenceFrame);
    }
    // Physical recovery has ended, but the interpolated display is still finishing
    // the final attack frame. Its atlas must not switch to idle/walk prematurely.
    d.previousSwing = 0.02;
    d.swing = 0;
    d.moving = true;
    d.phase = 5;
    d.previousPhase = 4;
    const exit = [];
    for (const alpha of [0, 0.25, 0.5, 0.75, 1]) {
      g.present(alpha, 1 / 120);
      g.renderer.render(g.scene, g.camera);
      exit.push({
        clip: d.activeClip,
        frame: d.sequenceFrame,
        length: d.sequenceLength,
        atlas: d.sprite.material.map === d.riggedMaps.sword.map,
      });
    }
    return { entry, exit };
  });
  expect(result.entry.every((frame) => frame === 0)).toBe(true);
  expect(
    result.exit
      .slice(0, 4)
      .every(
        (s) =>
          s.clip === "attack" && s.length === 33 && s.atlas && s.frame >= 30,
      ),
  ).toBe(true);
  expect(result.exit.at(-1).clip).toBe("walk");
  expect(result.exit.at(-1).length).toBe(48);
  expect(result.exit.at(-1).atlas).toBe(true);
});
