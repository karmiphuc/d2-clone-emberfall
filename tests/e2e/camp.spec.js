import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const { renderer } = window.__camp.game;
    renderer.setPixelRatio(0.5);
    renderer.shadowMap.enabled = false;
  });
}

test("town transactions, recruitment and quest progress survive reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.evaluate(() => window.__camp.interact("Akara"));
  await page.getByRole("button", { name: "Ask about the encampment" }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.evaluate(() => window.__camp.interact("Charsi"));
  await page.getByRole("button", { name: "Buy & equip longsword" }).click();
  await expect(
    page.getByRole("button", { name: "Tempered longsword equipped" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.evaluate(() => window.__camp.interact("Stash"));
  await page.getByRole("button", { name: "Deposit 50 gold" }).click();
  await page.getByRole("button", { name: "Withdraw 50 gold" }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.evaluate(() => window.__camp.interact("Kashya"));
  await page.getByRole("button", { name: "Dismiss Ilyra" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__camp.getCompanions()[0].visible))
    .toBe(false);
  await page.getByRole("button", { name: "Recruit Ilyra" }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  const state = await page.evaluate(() => window.__camp.getState());
  expect(state).toMatchObject({
    quest: true,
    weapon: true,
    gold: 140,
    stash: 0,
  });
  expect(state.visited).toHaveLength(3);
  expect(state.roster).toHaveLength(3);
  expect(errors).toEqual([]);
});

test("hero routes around the fire and mobile controls stay inside the viewport", async ({
  page,
}) => {
  await ready(page);
  const result = await page.evaluate(() => {
    const { game } = window.__camp;
    window.__camp.moveTo(-8.8, -4.6);
    let clipped = false;
    for (let i = 0; i < 250; i++) {
      game.update(0.05, i * 0.05, false);
      const p = game.hero.position;
      if (
        game.obstacles.some(
          (o) => Math.abs(p.x - o.x) < o.w / 2 && Math.abs(p.z - o.z) < o.d / 2,
        )
      )
        clipped = true;
    }
    return { clipped, position: window.__camp.getHero() };
  });
  expect(result.clipped).toBe(false);
  expect(result.position[0]).toBeLessThan(-6);
  expect(result.position[2]).toBeLessThan(-2);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Controls", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
