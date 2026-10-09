import test from "node:test";
import assert from "node:assert/strict";
import { createCombat, ENCOUNTERS } from "../../src/game/combat.js";
import { freshState, normalizeSave, claimReward } from "../../src/game/save.js";
const positions = (x = -8, z = 3) => [
  { id: "hero", x, z, active: true },
  ...["Ilyra", "Bram", "Eira"].map((id) => ({ id, x: 0, z: 0, active: false })),
];

test("legacy saves gain encounter fields and invalid storage is normalized", () => {
  const s = normalizeSave({
    version: 1,
    gold: 90,
    roster: ["Ilyra", "Ilyra", "<script>"],
    potions: -5,
    visited: ["Charsi"],
    defeated: ["fallen-1"],
    lootTaken: ["fallen-1", "brute"],
  });
  assert.equal(s.gold, 90);
  assert.equal(s.potions, 3);
  assert.deepEqual(s.roster, ["Ilyra"]);
  assert.deepEqual(s.lootTaken, ["fallen-1"]);
  assert.equal(s.rewardClaimed, false);
  assert.deepEqual(normalizeSave({ version: 900 }), freshState());
});
test("an autoattack obeys its cooldown and cannot repeatedly award a kill", () => {
  const state = freshState(),
    combat = createCombat(state);
  combat.select("fallen-1");
  combat.tick(1 / 30, positions());
  const hp = combat.enemies[0].hp;
  for (let i = 0; i < 5; i++) combat.tick(1 / 30, positions());
  assert.equal(combat.enemies[0].hp, hp);
  for (let i = 0; i < 150; i++) combat.tick(1 / 30, positions());
  assert.equal(state.defeated.filter((id) => id === "fallen-1").length, 1);
  assert.equal(state.lootTaken.filter((id) => id === "fallen-1").length, 1);
});
test("enemy windups give the hero time to leave attack range", () => {
  const c = createCombat(freshState());
  c.tick(1 / 30, positions());
  assert.ok(c.enemies[0].windup > 0);
  assert.equal(c.allies[0].hp, 120);
  for (let i = 0; i < 25; i++) c.tick(1 / 30, positions(-16, 12));
  assert.equal(c.allies[0].hp, 120);
});
test("potions are consumed only when restoring life", () => {
  const state = freshState(),
    c = createCombat(state);
  assert.equal(c.heal(), false);
  assert.equal(state.potions, 3);
  c.allies[0].hp = 25;
  assert.equal(c.heal(), true);
  assert.equal(c.allies[0].hp, 90);
  assert.equal(state.potions, 2);
  c.allies[0].hp = 0;
  assert.equal(c.heal(), false);
  assert.equal(state.potions, 2);
});
test("downed allies do not act and recovering restores the whole party", () => {
  const c = createCombat(freshState());
  c.allies[1].hp = 0;
  c.tick(
    0.1,
    positions().map((p) =>
      p.id === "Ilyra" ? { ...p, x: -8, z: 3, active: true } : p,
    ),
  );
  assert.equal(c.allies[1].order, null);
  c.restore();
  assert.ok(c.allies.every((a) => a.hp === a.maxHp));
  assert.equal(c.mana, 60);
});
test("uncollected drops survive re-entry and collected gold cannot duplicate", () => {
  const s = freshState();
  s.defeated = ["fallen-1"];
  s.dropLocations["fallen-1"] = { x: -15, z: 9 };
  let c = createCombat(normalizeSave(JSON.parse(JSON.stringify(s))));
  assert.equal(c.drops[0].x, -15);
  c = createCombat(s);
  assert.equal(c.drops.length, 1);
  c.tick(1 / 30, positions(-15, 9));
  assert.equal(s.gold, 252);
  c = createCombat(s);
  c.tick(1 / 30, positions(-15, 9));
  assert.equal(s.gold, 252);
  assert.equal(c.drops.length, 0);
});
test("expedition reward requires every enemy and is granted once", () => {
  const s = freshState();
  assert.equal(claimReward(s), false);
  s.defeated = ENCOUNTERS.map((e) => e.id);
  assert.equal(claimReward(s), true);
  assert.equal(s.gold, 340);
  assert.equal(s.potions, 5);
  assert.equal(claimReward(s), false);
  assert.equal(s.gold, 340);
});
