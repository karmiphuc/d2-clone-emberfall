import { test, expect } from "@playwright/test";

test("shared backpack equips mercs, changes stats, validates weapon roles and survives dismissal/reload", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForFunction(() => !!window.__camp);
  await page.evaluate(() => {
    const s = window.__camp.getState();
    s.inventory = [
      { uid: "vest", itemId: "leather_vest" },
      { uid: "bow", itemId: "hunting_bow" },
      { uid: "sword", itemId: "iron_axe" },
    ];
    localStorage.setItem("emberfall-camp-v1", JSON.stringify(s));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  await page.locator('.party-card[data-name="Ilyra"]').click();
  await expect(page.getByLabel("Equip for", { exact: true })).toHaveValue(
    "Ilyra",
  );
  await page
    .getByRole("button", { name: "Iron handaxe, common, level 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Equip weapon on Ilyra", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".requirement")).toContainText("cannot use");
  await page
    .getByRole("button", {
      name: "Yew hunting bow, common, level 1",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Equip weapon on Ilyra", exact: true })
    .click();
  await expect(page.locator(".equipment-owner")).toContainText("14");
  expect(
    await page.evaluate(
      () =>
        window.__camp.game.companions.find(
          (a) => a.userData.characterId === "Ilyra",
        ).userData.weaponId,
    ),
  ).toBe("hunting_bow");
  await page
    .getByRole("button", {
      name: "Stitched leather, common, level 1",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Equip armor on Ilyra", exact: true })
    .click();
  await expect(page.locator(".equipment-owner")).toContainText("92");
  await expect(page.locator(".equipment-owner")).toContainText("5%");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", {
      name: "Unequip Stitched leather from Ilyra",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.keyboard.press("p");
  await page
    .getByRole("button", { name: "Dismiss Ilyra · Archer", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.reload();
  await page.waitForFunction(() => !!window.__camp);
  expect(
    await page.evaluate(
      () => window.__camp.getState().companionEquipment.Ilyra.weapon.itemId,
    ),
  ).toBe("hunting_bow");
  await page.keyboard.press("p");
  await page
    .getByRole("button", { name: "Recruit Ilyra · Archer", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Equipment for Ilyra", exact: true })
    .click();
  await expect(page.locator(".equipped-slot").first()).toContainText(
    "Yew hunting bow",
  );
  await page
    .getByRole("button", {
      name: "Unequip Yew hunting bow from Ilyra",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Yew hunting bow, common, level 1",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.__camp.enterMoor());
  await page.locator('.party-card[data-name="Ilyra"]').click();
  await expect(
    page.getByRole("button", {
      name: "Unequip Stitched leather from Ilyra",
      exact: true,
    }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
