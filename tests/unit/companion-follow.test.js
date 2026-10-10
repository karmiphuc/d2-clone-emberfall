import { test } from "node:test";
import assert from "node:assert/strict";
import {
  turnToward,
  companionPace,
  needsFollowRoute,
} from "../../src/companion-follow.js";

test("turns follow the short arc across the angle wrap and cannot snap", () => {
  assert.ok(
    Math.abs(
      turnToward(Math.PI - 0.02, -Math.PI + 0.02, 0.1) - (Math.PI + 0.02),
    ) < 1e-8,
  );
  assert.equal(turnToward(0, Math.PI / 2, 0.1), 0.1);
});

test("arrival hysteresis does not restart a settled companion for tiny target drift", () => {
  const state = { hasPath: false };
  const position = { x: 0, z: 0 };
  assert.equal(needsFollowRoute(state, position, { x: 0.3, z: 0 }), false);
  assert.equal(needsFollowRoute(state, position, { x: 0.8, z: 0 }), false);
  assert.equal(needsFollowRoute(state, position, { x: 1.2, z: 0 }), true);
  state.goal = { x: 1.2, z: 0 };
  state.hasPath = true;
  assert.equal(needsFollowRoute(state, position, { x: 1.4, z: 0 }), false);
  assert.equal(needsFollowRoute(state, position, { x: 2, z: 0 }), true);
  assert.equal(
    needsFollowRoute({ settled: true }, position, { x: 0.8, z: 0 }, true),
    true,
  );
});

test("pace accelerates smoothly, catches up and brakes near the destination", () => {
  const start = companionPace("Bram", 8, 0, 1 / 60);
  assert.ok(start > 0 && start < 1.1);
  const cruise = companionPace("Bram", 8, 4.3, 1);
  assert.ok(cruise > 5.6 && cruise < 6);
  assert.ok(companionPace("Bram", 0.1, 4.3, 0.2) < 1);
  assert.ok(companionPace("Nyx", 3, 5, 1) > companionPace("Bram", 3, 5, 1));
});
