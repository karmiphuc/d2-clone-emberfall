import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalizeSave } from "../../src/game/save.js";
import { createCombat } from "../../src/game/combat.js";
import {
  ITEMS,
  equipItem,
  unequipItem,
  companionStats,
  addLoot,
  sellItem,
} from "../../src/game/items.js";
import { dismiss, recruit } from "../../src/game/companions.js";

test("merc equipment changes real life, damage, armor, healing and casting speed", () => {
  const s = freshState();
  s.inventory = [
    { uid: "bow", itemId: "hunting_bow" },
    { uid: "armor", itemId: "leather_vest" },
    { uid: "staff", itemId: "renewal_staff" },
    { uid: "ring", itemId: "focus_ring" },
  ];
  const base = companionStats(s, "Ilyra");
  assert.equal(equipItem(s, "bow", "Ilyra"), true);
  assert.equal(equipItem(s, "armor", "Ilyra"), true);
  assert.equal(companionStats(s, "Ilyra").damage, base.damage + 5);
  assert.equal(companionStats(s, "Ilyra").life, base.life + 6);
  assert.equal(companionStats(s, "Ilyra").armor, 5);
  const heal = companionStats(s, "Eira").healing;
  assert.equal(equipItem(s, "staff", "Eira"), true);
  assert.equal(equipItem(s, "ring", "Eira"), true);
  assert.equal(companionStats(s, "Eira").healing, heal + 10);
  assert.ok(companionStats(s, "Eira").cooldownMultiplier < 1);
  const c = createCombat(s);
  assert.equal(c.allies.find((a) => a.id === "Ilyra").maxHp, base.life + 6);
});
test("weapons enforce role and level requirements; swaps and removal preserve exact items", () => {
  const s = freshState();
  s.inventory = [
    { uid: "bow", itemId: "hunting_bow" },
    { uid: "frost", itemId: "frost_bow" },
    { uid: "mace", itemId: "iron_mace" },
    { uid: "daggers", itemId: "steel_daggers" },
  ];
  assert.equal(equipItem(s, "bow", "hero"), false);
  assert.equal(equipItem(s, "mace", "Ilyra"), false);
  assert.equal(equipItem(s, "frost", "Ilyra"), false);
  assert.equal(equipItem(s, "daggers", "Nyx"), true);
  assert.equal(equipItem(s, "bow", "Ilyra"), true);
  s.xp = 320;
  assert.equal(equipItem(s, "frost", "Ilyra"), true);
  assert.equal(s.inventory.filter((i) => i.uid === "bow").length, 1);
  assert.equal(unequipItem(s, "weapon", "Ilyra"), true);
  assert.equal(unequipItem(s, "weapon", "Ilyra"), false);
  assert.equal(s.inventory.filter((i) => i.uid === "frost").length, 1);
});
test("reload, dismissal and recruitment retain merc equipment without duplicated ownership", () => {
  const s = freshState();
  s.inventory = [{ uid: "vest", itemId: "leather_vest" }];
  equipItem(s, "vest", "Bram");
  dismiss(s, "Bram");
  recruit(s, "Soren");
  const loaded = normalizeSave(JSON.parse(JSON.stringify(s)));
  assert.equal(loaded.companionEquipment.Bram.armor.uid, "vest");
  assert.equal(sellItem(loaded, "vest"), false);
  assert.equal(addLoot(loaded, { uid: "vest", itemId: "leather_vest" }), false);
  dismiss(loaded, "Soren");
  recruit(loaded, "Bram");
  assert.equal(companionStats(loaded, "Bram").life, 171);
});
test("save validation rejects duplicate merc items, invalid role gear and forged high-level weapons", () => {
  const s = freshState();
  s.companionEquipment.Ilyra.weapon = { uid: "shared", itemId: "hunting_bow" };
  s.companionEquipment.Bram.armor = { uid: "shared", itemId: "leather_vest" };
  s.companionEquipment.Eira.weapon = { uid: "wrong", itemId: "iron_mace" };
  s.companionEquipment.Nyx.weapon = { uid: "high", itemId: "nightfang" };
  s.inventory = [{ uid: "shared", itemId: "hunting_bow" }];
  const clean = normalizeSave(s);
  assert.equal(clean.companionEquipment.Ilyra.weapon.uid, "shared");
  assert.equal(clean.companionEquipment.Bram.armor, null);
  assert.equal(clean.companionEquipment.Eira.weapon, null);
  assert.equal(clean.companionEquipment.Nyx.weapon, null);
  assert.equal(clean.inventory.length, 0);
  assert.equal(
    normalizeSave({ version: 1 }).companionEquipment.Eira.weapon,
    null,
  );
});
test("a full backpack prevents removing merc gear without losing it", () => {
  const s = freshState();
  s.inventory = [{ uid: "vest", itemId: "leather_vest" }];
  equipItem(s, "vest", "Bram");
  s.inventory = Array.from({ length: 60 }, (_, i) => ({
    uid: "item" + i,
    itemId: "copper_band",
  }));
  assert.equal(unequipItem(s, "armor", "Bram"), false);
  assert.equal(s.companionEquipment.Bram.armor.uid, "vest");
  assert.equal(s.inventory.length, 60);
});
test("equipped merc damage and protection affect actual combat", () => {
  function scenario(equipped) {
    const s = freshState(),
      events = [];
    if (equipped) {
      s.inventory = [
        { uid: "mace", itemId: "iron_mace" },
        { uid: "armor", itemId: "leather_vest" },
      ];
      equipItem(s, "mace", "Bram");
      equipItem(s, "armor", "Bram");
    }
    const c = createCombat(s, (e) => events.push(e));
    c.enemies.forEach((e, i) => {
      e.x = i ? 16 : 0;
      e.z = i ? 13 : 0;
      e.hp = e.maxHp = 1000;
      e.damage = 40;
      e.speed = 0;
    });
    for (let i = 0; i < 50; i++)
      c.tick(0.03, [
        { id: "hero", active: true, x: 5, z: 0 },
        { id: "Bram", active: true, x: 0, z: 1 },
      ]);
    return {
      attack: events.find((e) => e.type === "hit" && e.source === "Bram")
        .damage,
      taken: events.find((e) => e.type === "hit" && e.victim === "Bram").damage,
    };
  }
  const base = scenario(false),
    gear = scenario(true);
  assert.equal(gear.attack, base.attack + 5);
  assert.ok(gear.taken < base.taken);
});
