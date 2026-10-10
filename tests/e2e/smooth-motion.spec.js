import { test, expect } from "@playwright/test";

test("render interpolation moves figures between physics ticks and plays longer intermediate sprite sequences", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const result = await page.evaluate(() => {
    const g = window.__camp.game,
      d = g.hero.userData;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    g.stop();
    window.__camp.moveTo(-7, 5);
    g.update(1 / 30, 0, false);
    const samples = [];
    for (const alpha of [0.1, 0.35, 0.65, 0.9]) {
      g.present(alpha, 1 / 60);
      g.renderer.render(g.scene, g.camera);
      const p = g.hero.position.clone();
      d.body.getWorldPosition(p);
      samples.push([p.x, p.z]);
    }
    g.stop();
    d.moving = true;
    d.swing = 0;
    d.renderSwing = 0;
    const phases = [];
    for (const phase of [1.25, 4.5, 8.75]) {
      d.phase = d.renderPhase = phase;
      g.renderer.render(g.scene, g.camera);
      g.renderer.render(g.scene, g.camera);
      phases.push({
        mix: d.blendMix,
        sequence: d.sequenceActive,
        frame: d.sequenceFrame,
        count: d.sequenceLength,
      });
    }
    return { samples, phases };
  });
  const distances = result.samples
    .slice(1)
    .map((p, i) =>
      Math.hypot(p[0] - result.samples[i][0], p[1] - result.samples[i][1]),
    );
  expect(distances.every((d) => d > 0.001)).toBe(true);
  expect(Math.max(...distances)).toBeLessThan(0.06);
  expect(
    result.phases.every(
      (p) => p.sequence && p.count === 16 && p.mix > 0 && p.mix < 1,
    ),
  ).toBe(true);
  expect(new Set(result.phases.map((p) => p.frame)).size).toBe(3);
  expect(errors).toEqual([]);
});

test("the hero attacks in-range threats without selection and keeps retreat input responsive", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  const initial = await page.evaluate(() => {
    const { game: g } = window.__camp;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    g.companions.forEach((c) => (c.visible = false));
    g.hero.position.set(-8, 0, 4.5);
    g.combat.enemies.forEach((e, i) => {
      e.speed = 0;
      e.cooldown = 999;
      if (i) {
        e.x = 16;
        e.z = 13;
      }
    });
    return g.combat.enemies[0].hp;
  });
  await expect
    .poll(() => page.evaluate(() => window.__camp.game.combat.enemies[0].hp))
    .toBeLessThan(initial);
  const start = await page.evaluate(() =>
    window.__camp.game.hero.position.toArray(),
  );
  await page.keyboard.down("s");
  await page.waitForTimeout(300);
  await page.keyboard.up("s");
  const end = await page.evaluate(() =>
    window.__camp.game.hero.position.toArray(),
  );
  expect(Math.hypot(end[0] - start[0], end[2] - start[2])).toBeGreaterThan(0.3);
});

test("hero attacks advance through a full sprite sequence without a two-pose reset", async ({
  page,
}) => {
  const fields = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".bin")) fields.push(r.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const result = await page.evaluate(() => {
    const g = window.__camp.game,
      d = g.hero.userData;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    g.stop();
    g.animateAttack("hero");
    const samples = [];
    for (let i = 0; i < 66; i++) {
      d.swing = d.renderSwing = 0.55 - i / 120;
      d.moving = false;
      d.renderDt = 1 / 120;
      g.renderer.render(g.scene, g.camera);
      samples.push(d.sequenceFrame);
    }
    d.swing = d.renderSwing = 0.39;
    g.renderer.render(g.scene, g.camera);
    return {
      samples,
      contact: d.sequenceFrame,
      height: d.animationMaps.swordStrike.image.height,
      count: d.sequenceLength,
    };
  });
  expect(new Set(result.samples).size).toBeGreaterThan(24);
  expect(
    result.samples.every((v, i) => i === 0 || v >= result.samples[i - 1]),
  ).toBe(true);
  expect(result.contact).toBe(12);
  expect(result.count).toBe(33);
  expect(result.height).toBe(33 * 128);
  expect(fields).toEqual([]);
});
