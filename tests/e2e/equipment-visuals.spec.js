import { test, expect } from "@playwright/test";

test("equipment preview, equipped model and save agree after switching sword to axe", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const state = window.__camp.getState();
    state.inventory.push({ uid: "test:axe", itemId: "iron_axe" });
    localStorage.setItem("emberfall-camp-v1", JSON.stringify(state));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    window.__camp.game.renderer.setPixelRatio(0.5);
    window.__camp.game.renderer.shadowMap.enabled = false;
  });
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.weaponId),
  ).toBe("worn_sword");
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.spriteRow),
  ).toBe(0);
  await page.keyboard.press("i");
  await expect(page.locator(".preview-caption")).toHaveText(
    "Preview: Iron handaxe",
  );
  await expect(page.locator(".stat-up")).toContainText("+3");
  await page.getByRole("button", { name: "Equip weapon", exact: true }).click();
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.weaponId),
  ).toBe("iron_axe");
  expect(
    await page.evaluate(() => window.__camp.getState().equipment.weapon.itemId),
  ).toBe("iron_axe");
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.spriteRow),
  ).toBe(1);
  await expect(page.locator(".equipped-slot").first()).toContainText(
    "Iron handaxe",
  );
  await expect(
    page.getByRole("button", { name: "Worn longsword, common, level 1" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.weaponId),
  ).toBe("iron_axe");
  await page.evaluate(() => window.__camp.enterMoor());
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.weaponId),
  ).toBe("iron_axe");
  await page.keyboard.press("i");
  await expect(
    page.getByRole("button", { name: "Equip weapon", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("illustrated UI stays usable on a narrow screen and camera follows the hero", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    window.__camp.game.renderer.setPixelRatio(0.5);
    window.__camp.game.renderer.shadowMap.enabled = false;
  });
  for (const selector of [".bottom", "#inventory", "#skills-menu"]) {
    const b = await page.locator(selector).boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(390);
  }
  await page.keyboard.press("i");
  await expect(page.locator(".hero-illustration")).toBeVisible();
  await page
    .getByRole("button", { name: "Turn character", exact: true })
    .click();
  await expect(page.locator("#equipment-preview")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.keyboard.press("k");
  await page
    .getByRole("button", { name: "Learn Weapon Mastery", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show Combat masteries", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Learn Vitality", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  const result = await page.evaluate(() => {
    const { game } = window.__camp;
    game.updateCamera(1);
    const start = game.camera.position.clone();
    window.__camp.moveTo(-8.8, -4.6);
    for (let i = 0; i < 250; i++) {
      game.update(0.05, i * 0.05, false);
      game.updateCamera(0.05);
    }
    return {
      distance: game.camera.position.distanceTo(start),
      weapon: game.hero.userData.weaponId,
    };
  });
  expect(result.distance).toBeGreaterThan(5);
  expect(result.weapon).toBe("worn_sword");
});
