import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseActionVariant,
  beginAttackVariant,
  updateWalkVariant,
} from "../../src/action-variants.js";
import { advanceMotion } from "../../src/animation.js";

test("shuffle bags use all three action sets and prevent repeat across refills", () => {
  const data = { variantCount: 3 };
  const chosen = Array.from({ length: 30 }, () =>
    chooseActionVariant(data, "attack", () => 0.37),
  );
  for (let i = 0; i < chosen.length; i += 3)
    assert.equal(new Set(chosen.slice(i, i + 3)).size, 3);
  chosen.forEach((v, i) => {
    if (i) assert.notEqual(v, chosen[i - 1]);
  });
  assert.equal(data.walkVariant, undefined);
});
test("enemy windup and release share one set, duplicate strike events do not reselect", () => {
  const data = { variantCount: 3, swing: 0 };
  beginAttackVariant(data, true);
  const chosen = data.attackVariant,
    remaining = data.attackVariantBag.length;
  beginAttackVariant(data, false);
  assert.equal(data.attackVariant, chosen);
  assert.equal(data.attackVariantBag.length, remaining);
  data.swing = 0.26;
  beginAttackVariant(data);
  assert.equal(data.attackVariant, chosen);
  assert.equal(data.attackVariantBag.length, remaining);
  data.swing = 0;
  beginAttackVariant(data);
  assert.notEqual(data.attackVariant, chosen);
});
test("walk variants are stable within a stride and only change at start or loop seam", () => {
  const data = {
    variantCount: 3,
    gaitFrames: 16,
    phase: 0,
    swing: 0,
    travelDistance: 0.03,
  };
  advanceMotion(data, 0.01, true);
  const start = data.walkVariant;
  for (let i = 0; i < 25; i++) {
    advanceMotion(data, 0.01, true);
    assert.equal(data.walkVariant, start);
  }
  data.phase = 15.95;
  data.travelDistance = 0.03;
  advanceMotion(data, 0.01, true);
  assert.notEqual(data.walkVariant, start);
  const next = data.walkVariant;
  data.swing = 0.4;
  updateWalkVariant(data, false, 0);
  assert.equal(data.walkVariant, next);
  advanceMotion(data, 0.01, false, true);
  assert.equal(data.walkVariant, next);
});
