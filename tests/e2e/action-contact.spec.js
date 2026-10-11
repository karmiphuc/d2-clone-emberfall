import { test, expect } from "@playwright/test";

test("a real volley has one body action and three flying arrows before any contact", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  const result = await page.evaluate(() => {
    const g = window.__camp.game;
    window.__camp.enterMoor();
    g.stop();
    g.renderer.setPixelRatio(0.5);
    g.renderer.shadowMap.enabled = false;
    g.hero.position.set(-12, 0, 7);
    const archer = g.companions.find((a) => a.userData.companionId === "Ilyra");
    g.companions.forEach((a) => (a.visible = a === archer));
    archer.position.set(-8, 0, 5);
    g.combat.enemies.forEach((e, i) =>
      Object.assign(e, {
        x: i < 3 ? -8 + i * 0.5 : 30,
        z: i < 3 ? 3 : 30,
        hp: i < 3 ? 100 : 0,
        maxHp: 100,
        speed: 0,
        cooldown: 999,
      }),
    );
    g.combat.allies.forEach((a) => {
      a.cooldown = 0;
      a.specialCooldown = 0;
    });
    const starts = [];
    const animate = g.animateAttack;
    g.animateAttack = (...args) => {
      starts.push(args);
      animate(...args);
    };
    g.update(1 / 30, 0, false);
    g.updateCamera(1);
    g.renderer.render(g.scene, g.camera);
    const arrows = g.effects.root.children.filter(
      (o) => o.visible && o.userData.kind === "arrow",
    );
    const release = {
      actions: starts.filter((a) => a[0] === "Ilyra").length,
      arrows: arrows.length,
      hp: g.combat.enemies.slice(0, 3).map((e) => e.hp),
      clip: archer.userData.riggedClip,
      yaw: archer.rotation.y,
    };
    for (let i = 0; i < 2; i++) {
      g.update(1 / 30, i / 30, false);
      g.renderer.render(g.scene, g.camera);
    }
    const before = g.combat.enemies.slice(0, 3).map((e) => e.hp);
    for (let i = 0; i < 5; i++) {
      g.update(1 / 30, i / 30, false);
      g.renderer.render(g.scene, g.camera);
    }
    return {
      release,
      before,
      after: g.combat.enemies.slice(0, 3).map((e) => e.hp),
      actions: starts.filter((a) => a[0] === "Ilyra").length,
      yaw: archer.rotation.y,
    };
  });
  expect(result.release).toMatchObject({
    actions: 1,
    arrows: 3,
    hp: [100, 100, 100],
    clip: "attack",
  });
  expect(result.before).toEqual([100, 100, 100]);
  expect(result.after.every((hp) => hp < 100)).toBe(true);
  expect(result.actions).toBe(1);
  expect(result.yaw).toBe(result.release.yaw);
});

for (const input of ["keyboard", "pointer", "touch"]) {
  test(`${input} movement exits recovery immediately while retaining the attack cooldown`, async ({
    page,
    browser,
  }) => {
    let context;
    if (input === "touch") {
      context = await browser.newContext({
        hasTouch: true,
        viewport: { width: 1280, height: 800 },
      });
      page = await context.newPage();
    }
    try {
      await page.addInitScript(() => {
        requestAnimationFrame = () => 0;
      });
      await page.goto("/", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Controls", exact: true }).click();
      const point = await page.evaluate(() => {
        const g = window.__camp.game;
        window.__camp.enterMoor();
        g.stop();
        g.renderer.setPixelRatio(0.5);
        g.renderer.shadowMap.enabled = false;
        g.companions.forEach((a) => (a.visible = false));
        g.hero.position.set(-8, 0, 4.2);
        g.combat.enemies.forEach((e, i) =>
          Object.assign(e, {
            x: i ? 30 : -8,
            z: i ? 30 : 3,
            hp: i ? 0 : 1000,
            maxHp: 1000,
            speed: 0,
            cooldown: 999,
          }),
        );
        g.combat.select("fallen-1");
        for (let i = 0; i < 7; i++) g.update(1 / 30, i / 30, false);
        g.updateCamera(1);
        g.present(1, 1 / 60);
        g.renderer.render(g.scene, g.camera);
        const p = g.hero.position.clone();
        p.x -= 3;
        p.z += 2;
        p.y = 0;
        p.project(g.camera);
        return {
          x: (p.x * 0.5 + 0.5) * innerWidth,
          y: (-p.y * 0.5 + 0.5) * innerHeight,
          swing: g.hero.userData.swing,
          cooldown: g.combat.cooldowns.attack,
          position: g.hero.position.toArray(),
        };
      });
      expect(point.swing).toBeGreaterThan(0);
      expect(point.cooldown).toBeGreaterThan(0);
      if (input === "keyboard") await page.keyboard.down("a");
      else if (input === "touch") await page.touchscreen.tap(point.x, point.y);
      else await page.mouse.click(point.x, point.y);
      const result = await page.evaluate(() => {
        const g = window.__camp.game;
        g.update(1 / 30, 1, false);
        g.present(1, 1 / 60);
        g.renderer.render(g.scene, g.camera);
        return {
          swing: g.hero.userData.swing,
          clip: g.hero.userData.riggedClip,
          cooldown: g.combat.cooldowns.attack,
          position: g.hero.position.toArray(),
        };
      });
      if (input === "keyboard") await page.keyboard.up("a");
      expect(result.swing).toBe(0);
      expect(result.clip).toBe("walk");
      expect(result.cooldown).toBeGreaterThan(0);
      expect(result.cooldown).toBeLessThan(point.cooldown);
      expect(result.position).not.toEqual(point.position);
    } finally {
      if (context) await context.close();
    }
  });
}
