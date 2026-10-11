import test from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  normalizeSave,
  newExpedition,
  claimReward,
} from "../../src/game/save.js";
import {
  createCombat,
  CORE_ENCOUNTERS,
  ENCOUNTERS,
} from "../../src/game/combat.js";
import { DEN_ENCOUNTERS, claimDenReward } from "../../src/game/den.js";
import { questKills, RESPAWN_SECONDS } from "../../src/game/expedition.js";
import { lootItem, ITEMS, heroStats } from "../../src/game/items.js";
const heroAt = (x, z) => [{ id: "hero", x, z, active: true }];

test("partial expeditions replenish collected foes, preserve loose drops and permanently credit quests", () => {
  const s = freshState();
  s.defeated = ["fallen-1", "fallen-2", "brute"];
  s.lootTaken = ["fallen-1", "brute"];
  s.dropItems["fallen-2"] = { uid: "loose", itemId: "copper_band" };
  s.dropLocations["fallen-2"] = { x: -5, z: 2 };
  s.den.defeated = ["den-1", "den-11"];
  s.den.lootTaken = ["den-1", "den-11"];
  assert.equal(newExpedition(s), true);
  assert.deepEqual(s.defeated, ["fallen-2", "brute"]);
  assert.deepEqual(s.den.defeated, ["den-11"]);
  assert.deepEqual(s.dropItems["fallen-2"], {
    uid: "loose",
    itemId: "copper_band",
  });
  assert.ok(questKills(s).includes("fallen-1"));
  assert.equal(s.spawnCounts["fallen-1"], 1);
  assert.equal(newExpedition(s), false);
  const restored = normalizeSave(s);
  assert.deepEqual(restored.questKills, s.questKills);
  assert.deepEqual(restored.spawnCounts, s.spawnCounts);
  assert.deepEqual(restored.den, s.den);
});

test("old saves migrate clears and respawning populations cannot revoke or repeat quest rewards", () => {
  const s = normalizeSave({
    version: 2,
    defeated: CORE_ENCOUNTERS.map((e) => e.id),
    lootTaken: CORE_ENCOUNTERS.map((e) => e.id),
    den: {
      defeated: DEN_ENCOUNTERS.map((e) => e.id),
      lootTaken: DEN_ENCOUNTERS.map((e) => e.id),
    },
  });
  newExpedition(s);
  assert.equal(claimReward(s), true);
  assert.equal(claimDenReward(s), true);
  const gold = s.gold;
  assert.equal(claimReward(s), false);
  assert.equal(claimDenReward(s), false);
  assert.equal(s.gold, gold);
  assert.equal(normalizeSave(s).den.rewardClaimed, true);
  const legacy = normalizeSave({
    version: 2,
    run: 2,
    rewardClaimed: true,
    defeated: [],
  });
  assert.ok(CORE_ENCOUNTERS.every((e) => questKills(legacy).includes(e.id)));
  assert.equal(claimReward(legacy), false);
  assert.doesNotThrow(() =>
    normalizeSave({ version: 2, defeated: 123, den: { defeated: 123 } }),
  );
});

test("field respawns wait for collection and keep away from every living party member", () => {
  const s = freshState();
  s.defeated = ["fallen-1", "fallen-2", "brute"];
  s.lootTaken = ["fallen-1", "brute"];
  const events = [],
    c = createCombat(s, (e) => events.push(e));
  c.enemies.forEach((e) => {
    if (!s.defeated.includes(e.id)) e.hp = 0;
  });
  const e = c.enemies[0];
  c.tick(RESPAWN_SECONDS + 1, heroAt(e.x, e.z));
  assert.equal(e.hp, 0);
  c.tick(0.1, [
    { id: "hero", x: 35, z: 30, active: true },
    { id: "Bram", x: e.x, z: e.z, active: true },
  ]);
  assert.equal(e.hp, 0);
  c.tick(0.1, heroAt(35, 30));
  assert.equal(e.hp, e.maxHp);
  assert.equal(
    c.enemies[1].hp,
    0,
    "uncollected drops protect their population slot",
  );
  assert.equal(c.enemies.find((e) => e.id === "brute").hp, 0);
  assert.equal(s.spawnCounts[e.id], 1);
  assert.ok(events.some((e) => e.type === "respawn"));
  assert.notEqual(lootItem(s, e.id, 0).uid, lootItem(s, e.id, 0, false, 1).uid);
});

function encounter(enemy) {
  const state = freshState(),
    events = [],
    c = createCombat(state, (e) => events.push(e));
  c.setArea([{ ...enemy, x: 0, z: 0, hp: 500 }], state.den);
  return { state, events, c, e: c.enemies[0] };
}

test("committed boss strikes miss a close sidestep and expose a recovery window", () => {
  const { c, e, events } = encounter(DEN_ENCOUNTERS.at(-1));
  c.tick(0.01, heroAt(0, 1.4));
  assert.ok(e.windup > 0);
  assert.deepEqual(e.attackAim, { x: 0, z: 1 });
  const before = c.allies[0].hp;
  c.tick(0.96, heroAt(1.4, 0));
  assert.equal(c.allies[0].hp, before);
  assert.ok(events.some((e) => e.type === "enemyAttack"));
  assert.ok(e.recovery > 0);
  const x = e.x;
  c.tick(0.2, heroAt(3, 0));
  assert.equal(e.x, x);
});

test("ember callers release visible bolts before damage", () => {
  const caster = ENCOUNTERS.find((e) => e.behavior === "ember");
  const { c, e, events } = encounter(caster);
  c.tick(0.01, heroAt(0, 5));
  c.tick(0.71, heroAt(0, 5));
  assert.equal(c.allies[0].hp, c.allies[0].maxHp);
  assert.ok(events.some((e) => e.type === "projectile" && e.hostile));
  c.tick(0.22, heroAt(0, 5));
  assert.ok(c.allies[0].hp < c.allies[0].maxHp);
  assert.ok(e.cooldown > 0);
});

test("named boss trophies differ and high-level items introduce meaningful haste and sustain", () => {
  const bosses = [...ENCOUNTERS.filter((e) => e.boss), DEN_ENCOUNTERS.at(-1)];
  const s = freshState();
  const trophies = bosses.map(
    (e, i) => lootItem(s, e.id, i, true, 0, e.reward).itemId,
  );
  assert.equal(new Set(trophies).size, 7);
  assert.ok(Object.keys(ITEMS).length >= 65);
  s.equipment.ring = { uid: "haste", itemId: "quicksilver_band" };
  s.equipment.charm = { uid: "sustain", itemId: "bloodstone" };
  assert.equal(heroStats(s).haste, 8);
  assert.equal(heroStats(s).leech, 3);
  const c = createCombat(s);
  c.allies[0].hp = 30;
  Object.assign(c.enemies[0], { x: 0, z: 1 });
  c.tick(0.01, heroAt(0, 0));
  assert.ok(c.preparing.duration < 0.55);
  c.tick(0.15, heroAt(0, 0));
  assert.ok(
    c.allies[0].hp > 30,
    "life steal restores life at actual damage contact",
  );
});

test("Cleave interrupts ordinary windups but bosses retain their committed attack", () => {
  const { c, e } = encounter(CORE_ENCOUNTERS[0]);
  c.tick(0.01, heroAt(0, 1.4));
  assert.ok(e.windup > 0);
  c.cleave(e.id);
  c.tick(0.23, heroAt(0, 1.4));
  assert.equal(e.windup, 0);
  assert.ok(e.recovery > 0);
  const boss = encounter(DEN_ENCOUNTERS.at(-1));
  boss.c.tick(0.01, heroAt(0, 1.4));
  boss.c.cleave(boss.e.id);
  boss.c.tick(0.23, heroAt(0, 1.4));
  assert.ok(boss.e.windup > 0);
});
