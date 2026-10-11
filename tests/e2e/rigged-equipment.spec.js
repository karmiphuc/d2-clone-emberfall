import { test, expect } from "@playwright/test";

test("paladin weapon equipment selects mace geometry and restores its sword when unequipped", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "emberfall-camp-v1",
      JSON.stringify({
        version: 2,
        xp: 320,
        gold: 300,
        potions: 8,
        skills: { vitality: 2, mastery: 2 },
        roster: ["Aldric", "Bram", "Eira"],
        inventory: [{ uid: "mace-test", itemId: "iron_mace" }],
      }),
    ),
  );
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("i");
  await page.getByLabel("Equip for", { exact: true }).selectOption("Aldric");
  await page
    .getByRole("button", {
      name: "Iron flanged mace, common, level 1",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Equip weapon on Aldric", exact: true })
    .click();
  const equipped = await page.evaluate(() => {
    const a = window.__camp.game.companions.find(
        (c) => c.userData.companionId === "Aldric",
      ),
      d = a.userData;
    return {
      weapon: d.weaponId,
      key: d.motionKey,
      url: d.riggedMaps[d.motionKey].map.image.src,
    };
  });
  expect(equipped.weapon).toBe("iron_mace");
  expect(equipped.key).toBe("bMace");
  expect(equipped.url).toContain("aldricmace.webp");
  await page
    .getByRole("button", {
      name: "Unequip Iron flanged mace from Aldric",
      exact: true,
    })
    .click();
  const restored = await page.evaluate(() => {
    const d = window.__camp.game.companions.find(
      (c) => c.userData.companionId === "Aldric",
    ).userData;
    return { key: d.motionKey, url: d.riggedMaps[d.motionKey].map.image.src };
  });
  expect(restored.key).toBe("b");
  expect(restored.url).toContain("aldric.webp");
  expect(errors).toEqual([]);
});
