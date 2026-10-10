import { test, expect } from "@playwright/test";

async function seeded(page) {
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const state = window.__camp.getState();
    state.xp = 220;
    state.skills = { mastery: 1 };
    state.inventory = [
      "iron_axe",
      "leather_vest",
      "frost_edge",
      "focus_ring",
      "tempered_sword",
    ].map((itemId, i) => ({ itemId, uid: `ui:${i}` }));
    localStorage.setItem("emberfall-camp-v1", JSON.stringify(state));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__camp.game.renderer.setPixelRatio(0.5);
    window.__camp.game.renderer.shadowMap.enabled = false;
  });
}

test("talent inspection, keyboard selection and mobile branches preserve real training rules", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seeded(page);
  await page.keyboard.press("k");
  const before = await page.evaluate(() => window.__camp.getState().skills);
  await page.getByRole("button", { name: /^Inspect Wide Arc,/ }).click();
  await expect(page.locator("#talent-details")).toContainText(
    "3.1 reach · 150% weapon damage",
  );
  expect(await page.evaluate(() => window.__camp.getState().skills)).toEqual(
    before,
  );
  await page
    .getByRole("button", { name: "Train Wide Arc", exact: true })
    .click();
  await expect(page.locator("#talent-details")).toContainText(
    "3.7 reach · 165% weapon damage",
  );
  expect(
    await page.evaluate(() => window.__camp.getState().skills.wideArc),
  ).toBe(1);
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#talent-details h3")).toHaveText("Executioner");
  await expect(
    page.getByRole("button", { name: "Train Executioner", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".talent-reason")).toHaveText("Requires level 5");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Show War cries", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /^Inspect Battle Cry,/ }),
  ).toBeInViewport();
  await expect(
    page.getByRole("button", { name: /^Inspect Battle Flow,/ }),
  ).toBeInViewport();
  await page.getByRole("button", { name: /^Inspect Bulwark,/ }).click();
  await expect(page.locator("#talent-details h3")).toHaveText("Bulwark");
  await expect(page.locator(".talent-reason")).toHaveText(
    "Requires Battle Flow",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Reset talents · Free in camp", exact: true })
    .click();
  expect(await page.evaluate(() => window.__camp.getState().skills)).toEqual(
    {},
  );
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.__camp.enterMoor());
  await page.keyboard.press("k");
  await expect(page.locator(".talent-reason")).toHaveText(
    "Return to camp to train.",
  );
  await expect(
    page.getByRole("button", { name: "Train Bulwark", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("backpack filters and sorting keep selection, comparison and equipment consistent", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await seeded(page);
  await page.keyboard.press("i");
  await page.getByRole("button", { name: "Show armor", exact: true }).click();
  await expect(page.locator(".bag-item")).toHaveCount(1);
  await expect(page.locator(".item-detail")).toContainText("Stitched leather");
  await page.getByRole("button", { name: "Equip armor", exact: true }).click();
  expect(
    await page.evaluate(() => window.__camp.getState().equipment.armor.itemId),
  ).toBe("leather_vest");
  await page.getByRole("button", { name: "Show weapons", exact: true }).click();
  await page.getByLabel("Sort backpack", { exact: true }).selectOption("level");
  await expect(page.locator(".bag-item").first()).toHaveAttribute(
    "aria-label",
    "Frost-edged saber, magic, level 3",
  );
  await page.locator(".bag-item").first().click();
  await expect(page.locator(".preview-caption")).toHaveText(
    "Preview: Frost-edged saber",
  );
  await page.getByRole("button", { name: "Equip weapon", exact: true }).click();
  expect(
    await page.evaluate(() => window.__camp.game.hero.userData.weaponId),
  ).toBe("frost_edge");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Show trinkets", exact: true })
    .click();
  await expect(page.locator(".bag-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Sell · 22 gold", exact: true })
    .click();
  await expect(page.locator(".bag-empty")).toContainText(
    "No items in this category",
  );
  await page
    .getByRole("button", { name: "Show all items", exact: true })
    .click();
  expect(await page.locator(".bag-item").count()).toBeGreaterThan(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  expect(
    await page.evaluate(() => window.__camp.getState().equipment.weapon.itemId),
  ).toBe("frost_edge");
  expect(errors).toEqual([]);
});
