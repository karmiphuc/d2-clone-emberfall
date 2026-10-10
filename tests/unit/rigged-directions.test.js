import test from "node:test";
import assert from "node:assert/strict";
import { directionFrame } from "../../src/rigged-sprites.js";
const bearing = Math.atan2(30, 42);
test("baked views cover every direction and wrap consistently", () => {
  for (const directions of [8, 16])
    for (let i = 0; i < directions; i++) {
      const yaw = (i * Math.PI * 2) / directions;
      assert.equal(directionFrame(yaw, bearing, directions), i);
      assert.equal(directionFrame(yaw - Math.PI * 2, bearing, directions), i);
    }
});
test("facing hysteresis prevents boundary chatter and accounts for preview camera angle", () => {
  const step = (Math.PI * 2) / 16;
  assert.equal(directionFrame(step * 0.54, bearing, 16, 0), 0);
  assert.equal(directionFrame(step * 0.7, bearing, 16, 0), 1);
  assert.equal(directionFrame(0, 0, 16), Math.round(bearing / step));
  assert.equal(directionFrame(-step * 0.54, bearing, 16, 0), 0);
});
