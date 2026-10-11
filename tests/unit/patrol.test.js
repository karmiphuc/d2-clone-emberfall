import test from "node:test";
import assert from "node:assert/strict";
import { createCombat } from "../../src/game/combat.js";
import { freshState } from "../../src/game/save.js";

test("unengaged patrols alternate sustained walks and stable pauses", () => {
  const combat = createCombat(freshState());
  const enemy = combat.enemies.find((e) => e.id === "thicket-3");
  const home = { x: enemy.x, z: enemy.z };
  const runs = [];
  for (let tick = 0; tick < 900; tick++) {
    const { x, z } = enemy;
    combat.tick(
      1 / 30,
      [{ id: "hero", x: 100, z: 100, active: true }],
      true,
      true,
    );
    const moving = Math.hypot(enemy.x - x, enemy.z - z) > 0.00001;
    const previous = runs.at(-1);
    if (previous?.moving === moving) previous.ticks++;
    else runs.push({ moving, ticks: 1 });
    assert.ok(Math.hypot(enemy.x - home.x, enemy.z - home.z) < 1.2);
  }
  assert.ok(runs.length > 8, "multiple patrol cycles");
  assert.ok(
    runs.slice(0, -1).every((run) => run.ticks >= 30),
    JSON.stringify(runs),
  );
});

test("a blocked patrol pauses, chooses a new goal and can still aggro during a pause", () => {
  const combat = createCombat(
    freshState(),
    () => {},
    () => true,
  );
  const enemy = combat.enemies.find((e) => e.id === "thicket-3");
  const start = { x: enemy.x, z: enemy.z };
  const distant = [{ id: "hero", x: 100, z: 100, active: true }];
  combat.tick(1 / 30, distant, true, true);
  assert.equal(enemy.patrolGoal, null);
  assert.ok(enemy.patrolPause >= 1.4);
  const step = enemy.patrolStep;
  for (let i = 0; i < 20; i++) combat.tick(1 / 30, distant, true, true);
  assert.equal(enemy.patrolStep, step);
  assert.deepEqual({ x: enemy.x, z: enemy.z }, start);
  for (let i = 0; i < 60; i++) combat.tick(1 / 30, distant, true, true);
  assert.ok(enemy.patrolStep > step, "tries a new destination after the pause");

  const active = createCombat(freshState());
  const waiting = active.enemies.find((e) => e.id === "thicket-3");
  waiting.patrolPause = 2;
  active.tick(
    1 / 30,
    [{ id: "hero", x: waiting.x, z: waiting.z + 1, active: true }],
    true,
    true,
  );
  assert.equal(waiting.engaged, true);
  assert.ok(waiting.windup > 0);
});
