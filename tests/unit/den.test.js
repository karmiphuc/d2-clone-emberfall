import test from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  normalizeSave,
  newExpedition,
} from "../../src/game/save.js";
import { createCombat, ENCOUNTERS } from "../../src/game/combat.js";
import { DEN_ENCOUNTERS, claimDenReward } from "../../src/game/den.js";

test("old saves gain an empty Den and malformed area progress cannot claim rewards", () => {
  const s = normalizeSave({
    version: 2,
    den: {
      defeated: ["den-1", "den-1", "brute"],
      lootTaken: ["den-2", "den-1"],
      rewardClaimed: true,
    },
  });
  assert.deepEqual(s.den.defeated, ["den-1"]);
  assert.deepEqual(s.den.lootTaken, ["den-1"]);
  assert.equal(s.den.rewardClaimed, false);
  assert.equal(claimDenReward(s), false);
  assert.deepEqual(normalizeSave({ version: 2 }).den, freshState().den);
});
test("changing areas preserves party health and mana and scopes kill and loot progress", () => {
  const s = freshState(),
    c = createCombat(s);
  c.allies[0].hp = 40;
  c.defend();
  const mana = c.mana;
  c.setArea(DEN_ENCOUNTERS, s.den);
  assert.equal(c.allies[0].hp, 40);
  assert.equal(c.mana, mana);
  const enemy = c.enemies[0];
  c.select(enemy.id);
  for (let i = 0; i < 200 && enemy.hp > 0; i++)
    c.tick(0.05, [{ id: "hero", active: true, x: enemy.x, z: enemy.z }]);
  assert.deepEqual(s.defeated, []);
  assert.ok(s.den.defeated.includes(enemy.id));
  c.setArea(ENCOUNTERS, s);
  assert.equal(c.enemies[0].hp, c.enemies[0].maxHp);
  c.setArea(DEN_ENCOUNTERS, s.den);
  assert.equal(c.enemies[0].hp, 0);
});
test("Den bounty is one-time and Moor reset leaves dungeon progress intact", () => {
  const s = freshState();
  s.den.defeated = DEN_ENCOUNTERS.map((e) => e.id);
  assert.equal(claimDenReward(s), true);
  const gold = s.gold;
  assert.equal(claimDenReward(s), false);
  assert.equal(s.gold, gold);
  s.defeated = ENCOUNTERS.map((e) => e.id);
  s.lootTaken = [...s.defeated];
  assert.equal(newExpedition(s), true);
  assert.equal(s.den.defeated.length, 11);
  assert.equal(normalizeSave(s).den.rewardClaimed, true);
});

test("dungeon attacks cannot pass through a solid wall", () => {
  const state = freshState();
  const wall = (x) => x > 0.8 && x < 1.2;
  const combat = createCombat(state, () => {}, wall);
  combat.setArea(
    [{ ...DEN_ENCOUNTERS[0], x: 1.5, z: 0, hp: 100 }],
    state.den,
    () => [],
  );
  combat.select("den-1");
  const mana = combat.mana;
  assert.equal(combat.cleave("den-1"), true);
  assert.equal(combat.cleaveQueued, true);
  combat.tick(0.1, [{ id: "hero", active: true, x: 0, z: 0 }]);
  assert.equal(combat.enemies[0].hp, 100);
  assert.equal(combat.cleaveQueued, true);
  assert.equal(combat.mana, mana);
  assert.deepEqual(combat.allies[0].order, { x: 1.5, z: 0 });
});
