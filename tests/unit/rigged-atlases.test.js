import test from "node:test";
import assert from "node:assert/strict";
import { RIGGED_SPRITES } from "../../src/rigged-sprites.js";

test("packed character frames preserve scale and complete directional actions within texture bounds", () => {
  for (const actor of Object.values(RIGGED_SPRITES)) {
    for (const set of Object.values(actor.sets)) {
      const atlas = set.frames;
      assert.equal(atlas.directions, actor.directions);
      assert.equal(atlas.unitsPerPixel, 0.02625);
      assert.ok(Math.abs(atlas.stride - actor.stride) < 0.00001);
      assert.ok(atlas.height <= 8192);
      const occupied = [];
      for (const [clip, directions] of Object.entries(atlas.clips)) {
        assert.equal(directions.length, actor.directions);
        for (const frames of directions) {
          assert.equal(
            frames.length,
            clip === "walk" ? 48 : clip === "attack" ? actor.attackFrames : 1,
          );
          for (const f of frames) {
            assert.ok(f.w > 4 && f.h > 4 && f.w < 256 && f.h < 256);
            assert.ok(
              f.x >= 0 &&
                f.y >= 0 &&
                f.x + f.w <= atlas.width &&
                f.y + f.h <= atlas.height,
            );
            // Root offsets reconstruct a crop contained within the fixed render canvas.
            const cropX = 128 - f.origin[0],
              cropY = 192 - f.origin[1];
            assert.ok(
              cropX >= 0 &&
                cropY >= 0 &&
                cropX + f.w <= 256 &&
                cropY + f.h <= 256,
            );
            for (const p of occupied)
              assert.ok(
                f.x >= p.x + p.w ||
                  p.x >= f.x + f.w ||
                  f.y >= p.y + p.h ||
                  p.y >= f.y + f.h,
                "frames overlap",
              );
            occupied.push(f);
          }
        }
      }
    }
  }
});
