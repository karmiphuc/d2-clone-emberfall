import test from "node:test";
import assert from "node:assert/strict";
import { createCombat } from "../../src/game/combat.js";
import { freshState } from "../../src/game/save.js";
import { DEN_ENCOUNTERS, freshDen } from "../../src/game/den.js";
import {
  cancelAttackMotion,
  advanceMotion,
  motionPose,
} from "../../src/animation.js";

function scenario(role = "Ilyra", blocked = () => false, navigate = null) {
  const state = freshState(),
    events = [];
  const c = createCombat(state, (e) => events.push(e), blocked, navigate);
  c.enemies.forEach((e, i) =>
    Object.assign(e, {
      x: i < 3 ? i * 0.5 : 30,
      z: i < 3 ? 4 : 30,
      speed: 0,
      cooldown: 999,
      hp: 200,
      maxHp: 200,
    }),
  );
  const positions = [
    { id: "hero", x: 0, z: 0, active: true },
    { id: role, x: 0, z: 1, active: true },
  ];
  return { c, state, events, positions };
}
test("one volley releases three missiles and damage follows each flight exactly once", () => {
  const { c, events, positions } = scenario();
  c.tick(1 / 30, positions);
  const shots = events.filter((e) => e.type === "projectile");
  assert.equal(shots.length, 3);
  assert.equal(new Set(shots.map((e) => e.actionId)).size, 1);
  assert.equal(
    events.filter((e) => e.type === "swing" && e.id === "Ilyra").length,
    1,
  );
  assert.equal(events.filter((e) => e.type === "hit").length, 0);
  c.tick(0.04, positions);
  assert.ok(c.enemies.slice(0, 3).every((e) => e.hp === 200));
  c.tick(0.18, positions);
  assert.equal(
    events.filter((e) => e.type === "hit" && e.source === "Ilyra").length,
    3,
  );
  c.tick(0.2, positions);
  assert.equal(
    events.filter((e) => e.type === "hit" && e.source === "Ilyra").length,
    3,
  );
});
test("two lethal flights share one kill and one persistent drop; later flights fizzle", () => {
  const { c, state, events, positions } = scenario();
  c.enemies.slice(1).forEach((e) => (e.hp = 0));
  c.enemies[0].hp = 1;
  const eira = c.allies.find((a) => a.id === "Eira");
  eira.specialCooldown = 999;
  positions.push({ id: "Eira", x: 1, z: 1, active: true });
  c.tick(1 / 30, positions);
  assert.equal(events.filter((e) => e.type === "projectile").length, 2);
  c.tick(0.22, positions);
  assert.equal(events.filter((e) => e.type === "kill").length, 1);
  assert.equal(state.defeated.filter((id) => id === "fallen-1").length, 1);
  assert.equal(Object.keys(state.dropItems).length, 1);
  assert.equal(state.xp, 20);
});
test("area changes and camp restoration discard flights without changing saved enemy life", () => {
  for (const change of ["area", "restore"]) {
    const { c, events, positions } = scenario();
    c.tick(1 / 30, positions);
    if (change === "area") c.setArea(DEN_ENCOUNTERS, freshDen());
    else c.restore();
    positions[1].active = false;
    c.tick(0.22, positions);
    assert.equal(
      events.filter((e) => e.type === "hit" && e.source === "Ilyra").length,
      0,
    );
  }
});
test("released shots survive caster death and follow a moving target without retargeting", () => {
  const { c, events, positions } = scenario();
  c.enemies.slice(1).forEach((e) => (e.hp = 0));
  c.tick(1 / 30, positions);
  c.allies.find((a) => a.id === "Ilyra").hp = 0;
  c.enemies[0].x += 1;
  c.tick(0.22, positions);
  assert.equal(
    events.filter((e) => e.type === "hit" && e.source === "Ilyra").length,
    1,
  );
});
test("a wall appearing during flight blocks damage; healing cannot revive a fallen ally", () => {
  let wall = false;
  const { c, events, positions } = scenario(
    "Ilyra",
    () => wall,
    () => [],
  );
  c.tick(1 / 30, positions);
  wall = true;
  c.tick(0.22, positions);
  assert.equal(
    events.filter((e) => e.type === "hit" && e.source === "Ilyra").length,
    0,
  );
  const heal = scenario("Eira");
  heal.c.enemies.forEach((e) => (e.hp = 0));
  heal.c.allies[0].hp = 20;
  heal.c.tick(1 / 30, heal.positions);
  assert.ok(heal.events.some((e) => e.type === "cast"));
  heal.c.allies[0].hp = 0;
  heal.c.tick(0.22, heal.positions);
  assert.equal(heal.c.allies[0].hp, 0);
  assert.equal(heal.events.filter((e) => e.type === "heal").length, 0);
});
test("manual movement clears recovery history and resumes the calibrated gait", () => {
  const d = {
    swing: 0.2,
    previousSwing: 0.24,
    renderSwing: 0.22,
    phase: 20,
    previousPhase: 19,
    impactHold: 0.018,
    gaitFrames: 48,
    walkLoopSeconds: 1,
    walkStrideDistance: 3.5,
    travelDistance: 0.1,
  };
  cancelAttackMotion(d);
  advanceMotion(d, 1 / 30, true);
  assert.equal(d.previousSwing, 0);
  assert.equal(d.renderSwing, 0);
  assert.ok(d.phase > 0);
  assert.equal(motionPose(d, true).clip, "walk");
});
test("a creature holds position through recovery before chasing a departing victim", () => {
  const { c, events, positions } = scenario("Bram");
  positions[0].z = 3;
  positions[1].active = false;
  c.enemies.slice(1).forEach((e) => (e.hp = 0));
  c.enemies[0].speed = 1.65;
  c.enemies[0].cooldown = 0;
  for (let i = 0; i < 25 && !events.some((e) => e.type === "enemyAttack"); i++)
    c.tick(1 / 30, positions, false, true);
  assert.ok(c.enemies[0].recovery > 0);
  const z = c.enemies[0].z;
  positions[0].z = -5;
  for (let i = 0; i < 6; i++) c.tick(1 / 30, positions, false, true);
  assert.equal(c.enemies[0].z, z);
  for (let i = 0; i < 5; i++) c.tick(1 / 30, positions, false, true);
  assert.ok(c.enemies[0].z < z);
});
