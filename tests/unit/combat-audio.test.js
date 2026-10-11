import { test } from "node:test";
import assert from "node:assert/strict";
import { createCombatAudio } from "../../src/combat-audio.js";

function fixture() {
  const voices = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  const node = () => ({
    connect() {
      return this;
    },
    disconnect() {
      this.disconnected = true;
    },
    gain: param(),
    frequency: param(),
    Q: param(),
    pan: param(),
    threshold: param(),
    knee: param(),
    ratio: param(),
    attack: param(),
    release: param(),
  });
  const source = () => {
    const n = node();
    n.start = () => voices.push(n);
    n.stop = () => {};
    return n;
  };
  const context = {
    state: "running",
    currentTime: 0,
    sampleRate: 8000,
    destination: node(),
    createGain: node,
    createDynamicsCompressor: node,
    createStereoPanner: node,
    createBiquadFilter: node,
    createOscillator: source,
    createBufferSource: source,
    createBuffer: (_channels, size) => ({
      getChannelData: () => new Float32Array(size),
    }),
  };
  return { context, voices, play: createCombatAudio(context) };
}

test("release, arrival and healing remain audible without a global throttle swallowing contact", () => {
  const { play, voices } = fixture();
  assert.equal(play({ type: "swing", id: "Ilyra" }), false);
  assert.equal(play({ type: "projectile", id: "Ilyra", actionId: 12 }), true);
  assert.equal(play({ type: "projectile", id: "Ilyra", actionId: 12 }), false);
  assert.equal(play({ type: "hit", source: "Ilyra" }), true);
  assert.equal(play({ type: "heal", id: "hero" }), true);
  assert.equal(voices.length, 7);
});
test("muted and distant events allocate no voices; clearing permits a fresh action", () => {
  const { context, play, voices } = fixture();
  context.state = "suspended";
  assert.equal(play({ type: "hit" }), false);
  context.state = "running";
  assert.equal(play({ type: "hit", volume: 0 }), false);
  assert.equal(voices.length, 0);
  assert.equal(play({ type: "hit" }), true);
  play.clear();
  assert.equal(play({ type: "hit" }), true);
});
test("crowded battles bound simultaneous voices and recycle ended nodes", () => {
  const { context, play, voices } = fixture();
  for (let i = 0; i < 50; i++) {
    context.currentTime += 0.04;
    play({ type: "hit" });
  }
  assert.equal(voices.length, 24);
  for (const voice of voices) {
    voice.onended();
    assert.equal(voice.disconnected, true);
  }
  context.currentTime += 0.04;
  assert.equal(play({ type: "hit", heavy: true }), true);
  assert.equal(voices.length, 27);
});
test("hostile bolts have their own release and do not also play a melee swing", () => {
  const { play } = fixture();
  assert.equal(
    play({ type: "projectile", id: "embercaller", hostile: true, actionId: 1 }),
    true,
  );
  assert.equal(play({ type: "enemyAttack", ranged: true }), false);
  assert.equal(play({ type: "enemyAttack", heavy: true }), true);
});
