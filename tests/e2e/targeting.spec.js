import { test, expect } from "@playwright/test";

test("visible silhouettes can be hovered and right-clicked; transparent margins remain ground", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !!window.__camp);
  const points = await page.evaluate(() => {
    const { game } = window.__camp;
    game.renderer.setPixelRatio(0.5);
    game.renderer.shadowMap.enabled = false;
    window.__camp.enterMoor();
    game.hero.position.set(-12, 0, 8);
    game.companions.forEach((c) => (c.visible = false));
    game.combat.enemies.forEach((e, i) => {
      e.speed = 0;
      e.cooldown = 999;
      if (i) {
        e.x = 40;
        e.z = 40;
      }
    });
    game.update(0.03, 0, false);
    game.updateCamera(1);
    game.renderer.render(game.scene, game.camera);
    const sprite = game.enemyModels.get("fallen-1").userData.sprite;
    const origin = game.hero.position.clone();
    sprite.getWorldPosition(origin);
    const right = origin
        .clone()
        .setFromMatrixColumn(game.camera.matrixWorld, 0),
      up = origin.clone().setFromMatrixColumn(game.camera.matrixWorld, 1);
    const project = (u, v) => {
      const p = origin
        .clone()
        .addScaledVector(right, (u - sprite.center.x) * sprite.scale.x)
        .addScaledVector(up, (v - sprite.center.y) * sprite.scale.y)
        .project(game.camera);
      return {
        x: (p.x * 0.5 + 0.5) * innerWidth,
        y: (-p.y * 0.5 + 0.5) * innerHeight,
      };
    };
    return { body: project(0.6, 0.6), blank: project(0.02, 0.98) };
  });
  await page.mouse.move(points.body.x, points.body.y);
  await expect
    .poll(() => page.evaluate(() => window.__camp.game.hoveredEnemy))
    .toBe("fallen-1");
  await expect(
    page.getByRole("button", { name: "Attack Fallen fallen-1", exact: true }),
  ).toHaveClass(/hovered/);
  await page.mouse.move(points.blank.x, points.blank.y);
  await expect
    .poll(() => page.evaluate(() => window.__camp.game.hoveredEnemy))
    .toBe(null);
  await page.mouse.click(points.blank.x, points.blank.y);
  expect(await page.evaluate(() => window.__camp.game.combat.target)).toBe(
    null,
  );
  await page.evaluate(() => {
    const { game } = window.__camp;
    game.stop();
    game.hero.position.set(-12, 0, 8);
    game.updateCamera(1);
  });
  await page.mouse.click(points.body.x, points.body.y, { button: "right" });
  expect(await page.evaluate(() => window.__camp.game.combat.target)).toBe(
    "fallen-1",
  );
  expect(
    await page.evaluate(() => window.__camp.game.combat.cleaveQueued),
  ).toBe(true);
  const result = await page.evaluate(() => {
    const { game } = window.__camp,
      c = game.combat;
    const hp = c.enemies[0].hp,
      mana = c.mana;
    for (let i = 0; i < 60; i++) game.update(1 / 30, i / 30, false);
    return {
      hit: c.enemies[0].hp < hp,
      spent: c.mana < mana,
      queued: c.cleaveQueued,
    };
  });
  expect(result).toEqual({ hit: true, spent: true, queued: false });
  expect(errors).toEqual([]);
});
