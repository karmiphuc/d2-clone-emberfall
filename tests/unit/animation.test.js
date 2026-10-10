import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceMotion,
  motionPose,
  facingColumn,
} from "../../src/animation.js";

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

test("six-phase attacks show anticipation before contact and a full recovery", () => {
  const actor = {
    detailedMotion: true,
    swing: 0.55,
    attackDuration: 0.55,
    attackWindup: 0.16,
  };
  assert.equal(motionPose(actor, true).row, 0);
  actor.swing = 0.45;
  assert.equal(motionPose(actor, true).row, 1);
  actor.swing = 0.39;
  assert.equal(motionPose(actor, true).row, 2);
  actor.swing = 0.27;
  assert.equal(motionPose(actor, true).row, 3);
  actor.swing = 0.16;
  assert.equal(motionPose(actor, true).row, 4);
  actor.swing = 0.05;
  assert.equal(motionPose(actor, true).row, 5);
});
test("stride phase follows distance and impact holds cannot stop gameplay clocks", () => {
  const actor = {
    gaitFrames: 6,
    strideLength: 2.4,
    travelDistance: 1.2,
    phase: 0,
    swing: 0.3,
    impactHold: 0.04,
  };
  advanceMotion(actor, 0.03, true);
  assert.equal(actor.phase, 3);
  assert.equal(actor.swing, 0.3);
  actor.travelDistance = 0;
  advanceMotion(actor, 0.03, true);
  assert.equal(actor.phase, 3);
  assert.ok(actor.swing < 0.3);
});
test("facing stays stable near a quadrant edge but turns decisively", () => {
  assert.equal(facingColumn(-0.02, -0.6, 0), 0);
  assert.equal(facingColumn(-0.3, -0.6, 0), 1);
  assert.equal(facingColumn(-0.3, 0.02, 1), 1);
  assert.equal(facingColumn(-0.3, 0.4, 1), 2);
});

test("continuous pose samples meet at stride and attack boundaries without resetting", async () => {
  const { sequenceFrames } = await import("../../src/animation.js");
  const a = sequenceFrames(
      { moving: true, phase: 15.999, gaitFrames: 16 },
      true,
    ),
    b = sequenceFrames({ moving: true, phase: 16, gaitFrames: 16 }, true);
  assert.equal(a.next, b.row);
  assert.ok(a.mix > 0.99);
  assert.equal(b.mix, 0);
  const base = {
    detailedMotion: true,
    attackDuration: 0.55,
    attackWindup: 0.16,
  };
  const before = sequenceFrames({ ...base, swing: 0.39001 }, true),
    contact = sequenceFrames({ ...base, swing: 0.39 }, true);
  assert.equal(before.next, contact.row);
  assert.ok(before.mix > 0.99);
  assert.ok(contact.mix < 1e-8);
});

test("a complete hero swing progresses monotonically through 33 sprite frames and meets contact exactly", async () => {
  const { sequenceFrames } = await import("../../src/animation.js");
  const base = {
    detailedMotion: true,
    attackDuration: 0.55,
    attackWindup: 0.16,
  };
  let previous = -1;
  const frames = new Set();
  for (let i = 0; i < 550; i++) {
    const sample = sequenceFrames({ ...base, swing: 0.55 - i / 1000 }, true);
    const position = sample.row + sample.mix;
    assert.ok(position >= previous - 1e-8);
    previous = position;
    frames.add(sample.row);
    frames.add(sample.next);
  }
  assert.equal(frames.size, 33);
  const hit = sequenceFrames({ ...base, swing: 0.39 }, true);
  assert.equal(hit.row, 12);
  assert.ok(hit.mix < 1e-8);
  const end = sequenceFrames({ ...base, swing: 0.001 }, true);
  assert.equal(end.next, 32);
});

test("resuming a stopped gait begins forward at its contact pose rather than rewinding a whole stride", () => {
  const data = {
    gaitFrames: 16,
    phase: 11,
    previousPhase: 11,
    moving: false,
    motionWasMoving: false,
    swing: 0,
    travelDistance: 0.1,
  };
  advanceMotion(data, 1 / 30, true);
  assert.equal(data.previousPhase, 0);
  assert.ok(data.phase > 0 && data.phase < 1);
  const before = data.phase;
  advanceMotion(data, 1 / 30, true);
  assert.ok(data.phase > before);
});

test("party walk loops keep a fixed cadence, one bank and resume without phase resets", async () => {
  const { sequenceFrames } = await import("../../src/animation.js");
  const { renderedActionVariant } = await import(
    "../../src/action-variants.js"
  );
  const slow = {
    phase: 0,
    gaitFrames: 24,
    walkLoopSeconds: 0.8,
    variantCount: 3,
  };
  const fast = { ...slow };
  for (let i = 0; i < 96; i++) {
    slow.travelDistance = i % 2 ? 0.001 : 0.03;
    fast.travelDistance = 0.2;
    advanceMotion(slow, 1 / 60, true);
    advanceMotion(fast, 1 / 60, true);
    assert.equal(slow.phase, fast.phase);
    assert.equal(renderedActionVariant(slow, "walk", slow.phase), 0);
    assert.equal(sequenceFrames(slow).mix, 0);
    assert.equal(sequenceFrames(slow).row, Math.floor(slow.phase) % 24);
  }
  assert.equal(slow.phase, 48);
  advanceMotion(slow, 0.1, false);
  assert.equal(slow.phase, 48);
  assert.equal(motionPose(slow).clip, "idle");
  advanceMotion(slow, 1 / 60, true);
  assert.equal(slow.phase, 48.5);
  slow.swing = 0.26;
  advanceMotion(slow, 0.02, true);
  assert.equal(slow.phase, 48.5);
  assert.equal(motionPose(slow, true).clip, "attack");
});

test("rigged contact phase matches traveled distance across acceleration and pauses", () => {
  const a = {
    phase: 0,
    gaitFrames: 48,
    walkLoopSeconds: 0.88725,
    walkStrideDistance: 3.549,
    travelDistance: 1.7745,
  };
  advanceMotion(a, 0.01, true);
  assert.equal(a.phase, 24);
  a.travelDistance = 0;
  advanceMotion(a, 0.1, true);
  assert.equal(a.phase, 24);
  advanceMotion(a, 0.1, false);
  a.travelDistance = 3.549;
  advanceMotion(a, 0.01, true);
  assert.equal(a.phase, 72);
  a.swing = 0.2;
  advanceMotion(a, 0.05, true);
  assert.equal(a.phase, 72);
});
