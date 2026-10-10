import { test, expect } from "@playwright/test";

test("rigged actions stay coherent while legacy variants preserve atlas picking", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const result = await page.evaluate(() => {
    const g = window.__camp.game,
      d = g.hero.userData;
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    g.stop();
    const attacks = [];
    for (let action = 0; action < 6; action++) {
      d.swing = 0;
      g.animateAttack("hero");
      const variant = d.attackVariant;
      const samples = [];
      for (const swing of [0.53, 0.46, 0.39, 0.25, 0.1, 0.001]) {
        d.swing = d.renderSwing = swing;
        g.renderer.render(g.scene, g.camera);
        samples.push({
          variant: d.displayVariant,
          frame: d.sequenceFrame,
          column: d.sprite.material.map.offset.x,
        });
      }
      attacks.push({ variant, samples });
    }
    const maps = Object.values(d.animationMaps).map((map) => ({
      width: map.image.width,
      height: map.image.height,
      repeat: map.repeat.x,
    }));
    const others = [...g.companions, ...g.enemyModels.values()].map((a) => {
      const data = a.userData,
        samples = [];
      data.windup = 0;
      for (const action of ["walk", "attack"])
        for (const variant of [0, 1, 2]) {
          data.walkVariant = data.attackVariant = variant;
          data.moving = action === "walk";
          data.phase = data.renderPhase = 5.5;
          data.swing = data.renderSwing = action === "attack" ? 0.15 : 0;
          data.sprite.onBeforeRender(g.renderer, g.scene, g.camera);
          samples.push({
            action,
            variant:
              data.rigged || (action === "walk" && data.walkLoopSeconds)
                ? 0
                : variant,
            shown: data.displayVariant,
            clip: data.activeClip,
            column: data.sprite.material.map.offset.x,
            width: data.sprite.material.map.image.width,
          });
        }
      return {
        count: data.variantCount,
        character: data.characterId,
        columns: data.rigged?.directions || 12,
        cell: 96,
        rigged: !!data.rigged,
        samples,
      };
    });
    return { attacks, maps, others };
  });
  for (let i = 0; i < 6; i += 3)
    expect(
      new Set(result.attacks.slice(i, i + 3).map((a) => a.variant)).size,
    ).toBe(1);
  result.attacks.forEach((a, i) => {
    expect(a.variant).toBe(0);
    expect(a.samples.every((s) => s.variant === a.variant)).toBe(true);
    expect(a.samples[2].frame).toBe(12);
    expect(a.samples.every((s) => s.column >= 0 && s.column < 1)).toBe(true);
  });
  expect(result.maps.every((m) => m.width === 2048 && m.height > 0)).toBe(true);
  expect(
    result.others.every(
      (a) =>
        (a.character === "Bram" ? a.count === 1 : a.count === 3) &&
        a.samples.every(
          (s) =>
            s.shown === s.variant &&
            s.clip === s.action &&
            s.width === (a.rigged ? 2048 : a.cell * a.columns) &&
            s.column >= (a.count === 1 ? 0 : s.variant / 3) &&
            s.column < (a.count === 1 ? 1 : (s.variant + 1) / 3),
        ),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
