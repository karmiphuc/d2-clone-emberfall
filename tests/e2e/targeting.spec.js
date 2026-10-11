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
      const factor = (sprite.userData.frameScale || 1) / 1.4;
      u = 0.5 + (u - 0.5) * factor;
      v = 0.06 + (v - 0.06) * factor;
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

test.describe("direct touch targeting", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("tap silhouettes, keep the selected outline while inspecting another enemy, and target by keyboard", async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.addInitScript(() => {
      requestAnimationFrame = (callback) => {
        window.targetFrame = callback;
        return 1;
      };
    });
    await page.goto("/", { waitUntil: "networkidle" });
    const points = await page.evaluate(() => {
      const { game: g } = window.__camp;
      window.__camp.enterMoor();
      g.stop();
      g.renderer.setPixelRatio(1);
      g.renderer.shadowMap.enabled = false;
      g.hero.position.set(-8, 0, 6);
      g.hold = true;
      g.combat.enemies.forEach((e, i) => {
        e.speed = 0;
        e.cooldown = 999;
        e.hp = i < 2 ? e.maxHp : 0;
        e.x = i === 0 ? -11 : -5;
        e.z = 1;
        e.navigationReady = true;
      });
      g.update(0, 0, false);
      g.update(0, 0, false);
      g.updateCamera(1);
      window.targetNow = performance.now();
      targetFrame(targetNow);
      // Sample the source artwork to choose a genuinely opaque body point,
      // rather than clicking a rectangular nameplate or transparent margin.
      return g.combat.enemies.slice(0, 2).map((e) => {
        const sprite = g.enemyModels.get(e.id).userData.sprite;
        const frame = g.enemyModels.get(e.id).userData.packedFrame;
        const image = sprite.material.map.image;
        const canvas = document.createElement("canvas");
        canvas.width = frame.w;
        canvas.height = frame.h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          image,
          frame.x,
          frame.y,
          frame.w,
          frame.h,
          0,
          0,
          frame.w,
          frame.h,
        );
        const pixels = ctx.getImageData(0, 0, frame.w, frame.h).data;
        let best = Infinity,
          point;
        for (let y = 0; y < frame.h; y++)
          for (let x = 0; x < frame.w; x++) {
            if (pixels[(y * frame.w + x) * 4 + 3] < 250) continue;
            const distance =
              (x - frame.w * 0.5) ** 2 + (y - frame.h * 0.45) ** 2;
            if (distance < best) {
              best = distance;
              point = { x, y };
            }
          }
        const origin = g.hero.position.clone();
        sprite.getWorldPosition(origin);
        const scale = sprite.getWorldScale(origin.clone());
        const right = origin
          .clone()
          .setFromMatrixColumn(g.camera.matrixWorld, 0);
        const up = origin.clone().setFromMatrixColumn(g.camera.matrixWorld, 1);
        const p = origin
          .addScaledVector(
            right,
            ((point.x + 0.5) / frame.w - sprite.center.x) * scale.x,
          )
          .addScaledVector(
            up,
            (1 - (point.y + 0.5) / frame.h - sprite.center.y) * scale.y,
          )
          .project(g.camera);
        return {
          id: e.id,
          x: (p.x * 0.5 + 0.5) * innerWidth,
          y: (-p.y * 0.5 + 0.5) * innerHeight,
        };
      });
    });
    const render = () =>
      page.evaluate(() => {
        const g = window.__camp.game;
        g.update(0, 0, true);
        g.renderer.render(g.scene, g.camera);
        targetFrame(targetNow);
      });
    const pixels = (point) =>
      page.evaluate(({ x, y }) => {
        const g = window.__camp.game;
        g.renderer.render(g.scene, g.camera);
        const canvas = document.createElement("canvas");
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(g.renderer.domElement, 0, 0, innerWidth, innerHeight);
        const rgba = ctx.getImageData(
          Math.round(x) - 35,
          Math.round(y) - 35,
          70,
          70,
        ).data;
        let red = 0;
        for (let i = 0; i < rgba.length; i += 4)
          if (rgba[i] > 150 && rgba[i + 1] < 80 && rgba[i + 2] < 70) red++;
        return {
          red,
          body: [...ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data],
        };
      }, point);
    const before = await pixels(points[0]);
    const otherBefore = await pixels(points[1]);
    await page.touchscreen.tap(points[0].x, points[0].y);
    await render();
    expect(await page.evaluate(() => window.__camp.game.combat.target)).toBe(
      points[0].id,
    );
    const after = await pixels(points[0]);
    expect(after.red).toBeGreaterThan(before.red + 20);
    expect((await pixels(points[1])).red).toBe(otherBefore.red);
    // An outside contour must not paint over the opaque body or move its root.
    after.body
      .slice(0, 3)
      .forEach((value, i) =>
        expect(Math.abs(value - before.body[i])).toBeLessThan(5),
      );
    await page.mouse.move(points[1].x, points[1].y);
    await render();
    const selected = () =>
      page.evaluate(() =>
        [...window.__camp.game.enemyModels]
          .filter(([, model]) => model.userData.targetSelected)
          .map(([id]) => id),
      );
    expect(await selected()).toEqual([points[0].id]);
    expect(await page.evaluate(() => window.__camp.game.hoveredEnemy)).toBe(
      points[1].id,
    );
    const buttons = page.locator(".enemy-label:not([hidden])");
    expect(
      await buttons.evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            !node.textContent &&
            !node.children.length &&
            getComputedStyle(node).pointerEvents === "none" &&
            getComputedStyle(node).backgroundColor === "rgba(0, 0, 0, 0)",
        ),
      ),
    ).toBe(true);
    const second = page.getByRole("button", {
      name: new RegExp(` ${points[1].id}$`),
    });
    await second.focus();
    await page.keyboard.press("Enter");
    await render();
    expect(await selected()).toEqual([points[1].id]);
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await page.evaluate((id) => {
      window.__camp.game.combat.enemies.find((e) => e.id === id).hp = 0;
    }, points[1].id);
    await render();
    expect(await selected()).toEqual([]);
    await page.evaluate(() => window.__camp.returnToCamp());
    await render();
    await expect(page.locator(".enemy-label:not([hidden])")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
