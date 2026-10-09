import test from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  normalizeSave,
  newExpedition,
} from "../../src/game/save.js";
import { createCombat, ENCOUNTERS } from "../../src/game/combat.js";
import {
  levelOf,
  skillPoints,
  trainTalent,
  respec,
} from "../../src/game/progression.js";
import {
  heroStats,
  equipItem,
  sellItem,
  lootItem,
  addLoot,
  ITEMS,
} from "../../src/game/items.js";
import { recruit, dismiss, COMPANIONS } from "../../src/game/companions.js";

test("talent prerequisites, points and free respec change real combat statistics", () => {
  const s = freshState();
  assert.equal(trainTalent(s, "wideArc"), false);
  assert.equal(trainTalent(s, "mastery"), true);
  assert.equal(trainTalent(s, "vitality"), false);
  assert.equal(heroStats(s).damage, 11);
  s.xp = 220;
  assert.equal(levelOf(s), 3);
  assert.equal(skillPoints(s), 4);
  assert.equal(trainTalent(s, "wideArc"), true);
  assert.equal(trainTalent(s, "executioner"), false);
  respec(s);
  assert.equal(skillPoints(s), 5);
  assert.equal(heroStats(s).damage, 13);
  assert.equal(trainTalent(s, "vitality"), true);
  assert.equal(heroStats(s).life, 171);
  s.xp = 999999;
  assert.equal(levelOf(s), 6);
  assert.equal(skillPoints(s), 10);
});
test("equipment swaps preserve items, affect stats and cannot bypass level requirements", () => {
  const s = freshState();
  s.inventory = [
    { uid: "a", itemId: "leather_vest" },
    { uid: "b", itemId: "dawnsteel" },
  ];
  assert.equal(equipItem(s, "b"), false);
  assert.equal(equipItem(s, "a"), true);
  assert.equal(heroStats(s).armor, 5);
  assert.equal(heroStats(s).life, 126);
  assert.ok(s.inventory.some((i) => i.itemId === "traveler_coat"));
  const before = s.gold;
  assert.equal(sellItem(s, "a"), false);
  assert.equal(sellItem(s, "b"), true);
  assert.equal(s.gold, before + ITEMS.dawnsteel.value);
  assert.equal(sellItem(s, "b"), false);
});
test("old saves preserve purchases and gain unspent early-level talents", () => {
  const s = normalizeSave({
    version: 1,
    xp: 320,
    gold: 100,
    weapon: true,
    charm: true,
    roster: ["Ilyra", "Bram", "Eira"],
  });
  assert.equal(s.version, 2);
  assert.equal(levelOf(s), 3);
  assert.equal(skillPoints(s), 5);
  assert.equal(s.equipment.weapon.itemId, "tempered_sword");
  assert.equal(s.equipment.charm.itemId, "ashen_charm");
  assert.equal(heroStats(s).damage, 22);
});
test("repeat hunts require collecting drops, retain builds and create fresh loot IDs", () => {
  const s = freshState();
  const first = lootItem(s, "fallen-1", 0);
  addLoot(s, first);
  assert.equal(addLoot(s, first), false);
  s.xp = 320;
  s.skills.mastery = 1;
  s.defeated = ENCOUNTERS.map((e) => e.id);
  assert.equal(newExpedition(s), false);
  s.lootTaken = [...s.defeated];
  assert.equal(newExpedition(s), true);
  assert.equal(s.run, 1);
  assert.equal(s.xp, 320);
  assert.equal(s.skills.mastery, 1);
  assert.equal(s.inventory.length, 1);
  const second = lootItem(s, "fallen-1", 0);
  assert.notEqual(second.uid, first.uid);
  assert.equal(createCombat(s).enemies.filter((e) => e.hp > 0).length, 12);
});
test("recruitment enforces three active companions and supports all six specialists", () => {
  const s = freshState();
  assert.equal(recruit(s, "Soren"), false);
  assert.equal(dismiss(s, "Bram"), true);
  assert.equal(recruit(s, "Soren"), true);
  assert.equal(recruit(s, "Soren"), false);
  s.roster = [];
  for (const id of Object.keys(COMPANIONS)) {
    assert.equal(recruit(s, id), true);
    assert.equal(dismiss(s, id), true);
  }
  assert.equal(
    normalizeSave({ ...s, roster: Object.keys(COMPANIONS) }).roster.length,
    3,
  );
});
test("tampered saves cannot overspend talent points or duplicate item instances", () => {
  const s = normalizeSave({
    version: 2,
    xp: 0,
    skills: { vitality: 99, ironSkin: 2, mastery: 3 },
    inventory: [
      { uid: "x", itemId: "copper_band" },
      { uid: "x", itemId: "dawnsteel" },
      { uid: '\" onmouseover=\"x', itemId: "copper_band" },
    ],
  });
  assert.equal(skillPoints(s), 0);
  assert.deepEqual(s.skills, { vitality: 1 });
  assert.equal(s.inventory.length, 1);
});
function roleScenario(id) {
  const events = [],
    c = createCombat(freshState(), (e) => events.push(e));
  c.enemies.forEach((e, i) => {
    e.x = i < 3 ? i * 0.5 : 17;
    e.z = i < 3 ? 4 : 13;
    e.hp = e.maxHp = 200;
  });
  const positions = [
    { id: "hero", x: 0, z: 3, active: true },
    ...Object.keys(COMPANIONS).map((name) => ({
      id: name,
      x: 1,
      z: 3,
      active: name === id,
    })),
  ];
  return { c, events, positions };
}
test("tank taunts while archer volleys and mage slows multiple enemies", () => {
  let { c, events, positions } = roleScenario("Bram");
  c.tick(1 / 30, positions);
  assert.equal(c.enemies[0].taunter, "Bram");
  assert.ok(c.enemies[0].taunted > 0);
  ({ c, events, positions } = roleScenario("Ilyra"));
  c.tick(1 / 30, positions);
  assert.equal(
    events.filter((e) => e.type === "hit" && e.source === "Ilyra").length,
    3,
  );
  ({ c, events, positions } = roleScenario("Soren"));
  c.tick(1 / 30, positions);
  assert.ok(c.enemies.slice(0, 3).every((e) => e.slow > 0 && e.hp < e.maxHp));
});
test("healer restores injured allies without enemies, and assassin uses a backstab", () => {
  let { c, events, positions } = roleScenario("Eira");
  c.enemies.forEach((e) => {
    e.x = 17;
    e.z = 13;
  });
  c.allies[0].hp = 40;
  c.tick(1 / 30, positions);
  assert.ok(c.allies[0].hp > 40);
  assert.ok(events.some((e) => e.type === "heal" && e.source === "Eira"));
  ({ c, events, positions } = roleScenario("Nyx"));
  c.tick(1 / 30, positions);
  assert.ok(events.some((e) => e.type === "special" && e.name === "Backstab"));
  assert.ok(c.enemies.slice(0, 3).some((e) => e.hp <= 170));
});
test("paladin sanctuary mitigates attacks on a nearby ally", () => {
  function damage(withPaladin) {
    const { c, positions } = roleScenario("Aldric");
    c.enemies.slice(1).forEach((e) => (e.hp = 0));
    positions.find((p) => p.id === "Aldric").x = 3;
    positions.find((p) => p.id === "Aldric").active = withPaladin;
    for (let i = 0; i < 20; i++) c.tick(1 / 30, positions);
    return 120 - c.allies[0].hp;
  }
  assert.ok(damage(true) < damage(false));
});

test("Wide Arc reaches farther and Battle Cry heals only living allies on cooldown", () => {
  const baseline = createCombat(freshState());
  baseline.enemies.forEach((e) => {
    e.x = 3.5;
    e.z = 0;
  });
  assert.equal(baseline.cleave(), false);
  const s = freshState();
  s.xp = 760;
  s.skills = { mastery: 1, wideArc: 1, flow: 1, bulwark: 1, battleCry: 1 };
  const c = createCombat(s);
  c.enemies.forEach((e) => {
    e.x = 3.5;
    e.z = 0;
  });
  assert.equal(c.cleave(), true);
  c.allies[0].hp = 40;
  c.allies[1].hp = 30;
  c.allies[2].hp = 0;
  const mana = c.mana;
  c.rally();
  assert.equal(c.allies[0].hp, 65);
  assert.equal(c.allies[1].hp, 55);
  assert.equal(c.allies[2].hp, 0);
  assert.equal(c.mana, mana - 15);
  c.rally();
  assert.equal(c.allies[0].hp, 65);
});
