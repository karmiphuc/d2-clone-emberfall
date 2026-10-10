import test from "node:test";
import assert from "node:assert/strict";
import {
  MOOR_BOUNDS,
  MOOR_REGIONS,
  MOOR_OBJECTIVE_IDS,
  MOOR_EXTRA_ENCOUNTERS,
  huntComplete,
} from "../../src/game/moor.js";
import { ENCOUNTERS } from "../../src/game/combat.js";
import {
  freshState,
  normalizeSave,
  claimReward,
  newExpedition,
} from "../../src/game/save.js";
import { gridRoute } from "../../src/grid-route.js";

test("expanded packs fit the map, have unique persistent IDs and leave the starting road isolated", () => {
  assert.equal(MOOR_REGIONS.length, 10);
  assert.equal(ENCOUNTERS.length, 72);
  assert.equal(new Set(ENCOUNTERS.map((e) => e.id)).size, ENCOUNTERS.length);
  for (const e of MOOR_EXTRA_ENCOUNTERS) {
    assert.ok(e.x > MOOR_BOUNDS.minX + 2 && e.x < MOOR_BOUNDS.maxX - 2);
    assert.ok(e.z > MOOR_BOUNDS.minZ + 2 && e.z < MOOR_BOUNDS.maxZ - 2);
    assert.ok(Math.hypot(e.x + 13, e.z - 9) > 12);
  }
});
test("old-road bounty and repeat hunt remain available without clearing optional packs", () => {
  const s = freshState();
  s.defeated = [...MOOR_OBJECTIVE_IDS];
  assert.equal(huntComplete(s.defeated), true);
  assert.equal(claimReward(s), true);
  assert.equal(newExpedition(s), false);
  s.lootTaken = [...MOOR_OBJECTIVE_IDS];
  s.defeated.push(MOOR_EXTRA_ENCOUNTERS[0].id);
  assert.equal(newExpedition(s), true);
  assert.equal(s.defeated.length, 0);
});
test("outer-region drops survive reload, while out-of-world coordinates are rejected", () => {
  const e = MOOR_EXTRA_ENCOUNTERS[0],
    s = freshState();
  s.defeated = [e.id];
  s.dropLocations[e.id] = { x: e.x, z: e.z };
  assert.deepEqual(normalizeSave(s).dropLocations[e.id], { x: e.x, z: e.z });
  s.dropLocations[e.id] = { x: 1000, z: e.z };
  assert.equal(normalizeSave(s).dropLocations[e.id], undefined);
});
test("long navigation routes cross the enlarged footprint without cutting obstacle corners", () => {
  const blocked = (x, z) => Math.abs(x) < 1.2 && z < 15;
  const path = gridRoute(
    { x: -37, z: -28 },
    { x: 37, z: 28 },
    MOOR_BOUNDS,
    blocked,
  );
  assert.ok(path.length > 100);
  assert.ok(path.every((p) => !blocked(p.x, p.z)));
  assert.ok(path.some((p) => Math.abs(p.x) < 1.2 && p.z >= 15));
  assert.ok(Math.hypot(path.at(-1).x - 37, path.at(-1).z - 28) < 0.65);
});
