import { test } from "node:test";
import assert from "node:assert/strict";
import { combatFocus } from "../../src/combat-focus.js";

const enemy = (id, fields = {}) => ({
  id,
  hp: 30,
  x: 2,
  z: 2,
  label: { hidden: false },
  ...fields,
});
test("inspection overrides the nearby engaged elite without changing the selected creature", () => {
  const pack = [
    enemy("fallen"),
    enemy("brute", { elite: true, engaged: true }),
  ];
  const hero = { x: 0, z: 0 };
  assert.equal(combatFocus(pack, null, "fallen", hero).id, "brute");
  assert.equal(combatFocus(pack, "fallen", "fallen", hero).id, "fallen");
  assert.equal(pack[1].hp, 30);
});
test("dead, hidden, unaware or distant elites cannot steal target details", () => {
  for (const fields of [
    { hp: 0 },
    { label: { hidden: true } },
    { engaged: false },
    { x: 30 },
  ]) {
    const pack = [
      enemy("fallen"),
      enemy("brute", { elite: true, engaged: true, ...fields }),
    ];
    assert.equal(
      combatFocus(pack, "brute", "fallen", { x: 0, z: 0 })?.id,
      fields.hp === 0 || fields.label ? "fallen" : "brute",
    );
    assert.equal(
      combatFocus(pack, null, "fallen", { x: 0, z: 0 }).id,
      "fallen",
    );
  }
  assert.equal(
    combatFocus([enemy("dead", { hp: 0 })], null, "dead", { x: 0, z: 0 }),
    null,
  );
});
