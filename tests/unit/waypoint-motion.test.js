import test from "node:test";
import assert from "node:assert/strict";
import { stepWaypoints } from "../../src/waypoint-motion.js";

test("a tick crosses short route segments without false idle or lost travel budget", () => {
  const position = { x: 0, z: 0 },
    path = [
      { x: 0.03, z: 0 },
      { x: 0.08, z: 0 },
      { x: 0.2, z: 0 },
    ];
  const result = stepWaypoints(position, path, 0.133);
  assert.equal(result.moving, true);
  assert.ok(Math.abs(position.x - 0.133) < 1e-8);
  assert.equal(path.length, 1);
  assert.ok(Math.abs(result.travel - 0.133) < 1e-8);
  assert.equal(result.heading, Math.PI / 2);
});
test("reaching the final node is still a moving tick; only the next idle tick stops", () => {
  const position = { x: 0, z: 0 },
    path = [{ x: 0.04, z: 0 }];
  assert.equal(stepWaypoints(position, path, 0.133).moving, true);
  assert.equal(path.length, 0);
  assert.equal(position.x, 0.04);
  assert.equal(stepWaypoints(position, path, 0.133).moving, false);
});
test("duplicate nodes and a bend preserve distance and never move outside the route", () => {
  const position = { x: 0, z: 0 },
    path = [
      { x: 0, z: 0 },
      { x: 0.05, z: 0 },
      { x: 0.05, z: 0.2 },
    ];
  const result = stepWaypoints(position, path, 0.1);
  assert.ok(Math.abs(position.x - 0.05) < 1e-8);
  assert.ok(Math.abs(position.z - 0.05) < 1e-8);
  assert.equal(result.heading, 0);
  assert.equal(path.length, 1);
});
