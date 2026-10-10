import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { createMotionMaterial } from "../../src/sprite-motion-material.js";

test("crossfades keep both fractional poses, including the outgoing frame blend", () => {
  const idle = new T.Texture(),
    walk = new T.Texture(),
    m = createMotionMaterial(idle);
  const shader = {
    uniforms: {},
    vertexShader: "#include <common>\n#include <uv_vertex>",
    fragmentShader: "#include <common>\n#include <map_fragment>",
  };
  m.material.onBeforeCompile(shader);
  m.sample({
    map: idle,
    key: "idle",
    row: 0,
    next: 1,
    mix: 0.45,
    column: 0,
    count: 2,
    clip: "idle",
  });
  const result = m.sample({
    map: walk,
    key: "sword",
    row: 3,
    next: 4,
    mix: 0.8,
    column: 4,
    columns: 12,
    count: 16,
    clip: "walk",
    dt: 0.01,
  });
  assert.equal(shader.uniforms.frameMix.value, 0.8);
  assert.equal(shader.uniforms.previousMix.value, 0.45);
  assert.equal(shader.uniforms.poseAtlas.value, walk);
  assert.equal(shader.uniforms.previousAtlas.value, idle);
  assert.ok(result.transitionMix > 0 && result.transitionMix < 1);
  assert.equal(shader.uniforms.rectNext.value.y, 1 - 5 / 16);
  m.sample({
    map: walk,
    key: "sword",
    row: 6,
    next: 7,
    mix: 0.2,
    column: 4,
    columns: 12,
    count: 16,
    clip: "walk",
    dt: 0.1,
  });
  assert.equal(shader.uniforms.transitionMix.value, 1);
  assert.equal(shader.uniforms.frameMix.value, 0.2);
  assert.equal(m.material.depthWrite, false);
});

test("direct party walks never fade at entry, direction changes or exit", () => {
  const map = new T.Texture(),
    m = createMotionMaterial(map);
  for (const [clip, column] of [
    ["idle", 0],
    ["walk", 0],
    ["walk", 1],
    ["walk", 3],
    ["attack", 3],
  ]) {
    const sample = m.sample({
      map,
      key: clip,
      row: 0,
      next: 1,
      mix: 0,
      column,
      count: 24,
      clip,
      directWalk: true,
      dt: 1 / 120,
    });
    assert.equal(sample.transitionMix, 1);
    assert.equal(sample.mix, 0);
  }
});
