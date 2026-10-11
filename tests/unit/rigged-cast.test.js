import test from "node:test";
import assert from "node:assert/strict";
import { RIGGED_SPRITES, riggedClipSample } from "../../src/rigged-sprites.js";

test("every playable role and enemy archetype has coherent rigged actions", () => {
  for (const name of [
    "hero",
    "Ilyra",
    "Bram",
    "Eira",
    "Soren",
    "Aldric",
    "Nyx",
    "Fallen",
    "Risen",
    "Brute",
    "Gravewarden",
  ]) {
    const config = RIGGED_SPRITES[name];
    assert.ok(config, name);
    assert.ok(config.walkFrames >= 48);
    assert.ok(config.directions >= 8);
    for (const { frames } of Object.values(config.sets))
      for (const action of ["idle", "walk", "attack"])
        assert.ok(frames.clips[action], name + " " + action);
  }
  assert.notEqual(
    RIGGED_SPRITES.Aldric.sets.b.url,
    RIGGED_SPRITES.Aldric.sets.bMace.url,
  );
});
test("enemy windup advances toward contact, then recovery and death remain distinct", () => {
  const frames = RIGGED_SPRITES.Brute.sets.monsters.frames;
  const pose = { clip: "attack" },
    sample = { row: 0 };
  const rows = [0.95, 0.7, 0.45, 0.15, 0.001].map((windup) =>
    riggedClipSample({ windup, windupDuration: 0.95 }, pose, sample, frames),
  );
  assert.ok(
    rows.every(
      (s, i) => s.clip === "windup" && (i === 0 || s.row >= rows[i - 1].row),
    ),
  );
  assert.equal(rows[0].row, 0);
  assert.equal(rows.at(-1).row, 31);
  assert.deepEqual(riggedClipSample({ windup: 0 }, pose, sample, frames), {
    clip: "attack",
    row: 0,
  });
  assert.deepEqual(
    riggedClipSample({ deathTime: 1.2, windup: 0.5 }, pose, sample, frames),
    { clip: "death", row: 0 },
  );
  assert.equal(
    riggedClipSample({ deathTime: 0.001 }, pose, sample, frames).row,
    31,
  );
});
