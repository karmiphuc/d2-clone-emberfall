import test from "node:test";
import assert from "node:assert/strict";
import { createRenderBudget } from "../../src/render-budget.js";
test("sustained slow frames reduce render pixels gradually within bounds", () => {
  const budget = createRenderBudget(1.25);
  for (let i = 0; i < 20; i++) budget.tick(0.1);
  assert.equal(budget.ratio, 1.25);
  for (let i = 0; i < 150; i++) budget.tick(0.1);
  assert.ok(budget.ratio < 1);
  assert.ok(budget.ratio >= 0.65);
  for (let i = 0; i < 500; i++) budget.tick(0.1);
  assert.equal(budget.ratio, 0.65);
});
test("fast frames restore quality slowly and tab pauses do not degrade it", () => {
  const budget = createRenderBudget(1.25);
  for (let i = 0; i < 300; i++) budget.tick(0.1);
  const low = budget.ratio;
  budget.tick(2);
  assert.equal(budget.ratio, low);
  for (let i = 0; i < 500; i++) budget.tick(1 / 60);
  assert.ok(budget.ratio > low);
  assert.equal(budget.reset(1), 1);
  for (let i = 0; i < 1000; i++) budget.tick(1 / 60);
  assert.equal(budget.ratio, 1);
});
