import test from "node:test";
import assert from "node:assert/strict";
import { advanceMotion, motionPose } from "../../src/animation.js";

test("walking cycles both stride poses and stopping immediately restores idle", () => {
  const actor = { phase: 0, swing: 0 };
  const rows = new Set();
  for (let i = 0; i < 20; i++) {
    advanceMotion(actor, 0.05, true);
    rows.add(motionPose(actor, true).row);
  }
  assert.deepEqual([...rows].sort(), [0, 1]);
  advanceMotion(actor, 0.05, false);
  assert.equal(motionPose(actor, true).clip, "idle");
});

test("held actors finish attacks and downed actors cannot remain attacking", () => {
  const actor = { phase: 0, swing: 0.5 };
  advanceMotion(actor, 0.05, false);
  assert.equal(motionPose(actor, true).row, 2);
  advanceMotion(actor, 0.25, false);
  assert.equal(motionPose(actor, true).row, 3);
  advanceMotion(actor, 0.3, false);
  assert.equal(motionPose(actor, true).clip, "idle");
  actor.swing = 0.5;
  advanceMotion(actor, 0.01, true, true);
  assert.equal(actor.swing, 0);
  assert.equal(actor.moving, false);
  assert.equal(motionPose(actor, true).clip, "idle");
});

test("animation timing is consistent across frame rates", () => {
  const slow = { phase: 0, swing: 0.5 },
    fast = { ...slow };
  for (let i = 0; i < 10; i++) advanceMotion(slow, 0.03, true);
  for (let i = 0; i < 30; i++) advanceMotion(fast, 0.01, true);
  assert.deepEqual(motionPose(slow, true), motionPose(fast, true));
  assert.ok(Math.abs(slow.swing - fast.swing) < 0.000001);
});

test("enemy windup holds a readable raised-weapon pose until its strike", () => {
  const actor = { windup: 0.95, swing: 0, moving: false, phase: 0 };
  advanceMotion(actor, 0.1);
  assert.deepEqual(motionPose(actor, true), { clip: "attack", row: 2 });
  actor.windup = 0;
  actor.swing = 0.26;
  advanceMotion(actor, 0.05);
  assert.deepEqual(motionPose(actor, true), { clip: "attack", row: 3 });
  advanceMotion(actor, 0.3);
  assert.equal(motionPose(actor, true).clip, "idle");
});

test("companion release and recovery follow the actual strike, including held and downed actors", () => {
  const actor = { attackSequence: "release-recover", swing: 0.26, phase: 0 };
  advanceMotion(actor, 0.02, false);
  assert.deepEqual(motionPose(actor, true), { clip: "attack", row: 2 });
  advanceMotion(actor, 0.13, false);
  assert.deepEqual(motionPose(actor, true), { clip: "attack", row: 3 });
  advanceMotion(actor, 0.12, false);
  assert.equal(motionPose(actor, true).clip, "idle");
  actor.swing = 0.26;
  advanceMotion(actor, 0.01, true, true);
  assert.equal(motionPose(actor, true).clip, "idle");
});
