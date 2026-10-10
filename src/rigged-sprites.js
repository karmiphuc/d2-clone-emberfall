import swordFrames from "../assets/rigged/hero-longsword.json" with { type: "json" };
import axeFrames from "../assets/rigged/hero-hand_axe.json" with { type: "json" };
import maceFrames from "../assets/rigged/bram-mace.json" with { type: "json" };
// Cropped without resizing: exact root offsets preserve one world scale.
const sword = {
  url: new URL("../assets/rigged/hero-longsword.webp", import.meta.url).href,
  frames: swordFrames,
};
const axe = {
  url: new URL("../assets/rigged/hero-hand_axe.webp", import.meta.url).href,
  frames: axeFrames,
};
const mace = {
  url: new URL("../assets/rigged/bram-mace.webp", import.meta.url).href,
  frames: maceFrames,
};
export const RIGGED_SPRITES = {
  hero: {
    directions: 16,
    walkFrames: 48,
    attackFrames: 33,
    size: 6.72,
    stride: 3.5588,
    sets: { sword, axe },
  },
  Bram: {
    directions: 8,
    walkFrames: 48,
    attackFrames: 17,
    size: 6.72,
    stride: 3.5588,
    sets: { a: mace },
  },
};
export function directionFrame(yaw, cameraBearing, directions, previous) {
  const angle = yaw - cameraBearing + Math.atan2(30, 42),
    turn = Math.PI * 2,
    step = turn / directions;
  const normalized = ((angle % turn) + turn) % turn;
  if (previous !== undefined) {
    const delta = Math.atan2(
      Math.sin(angle - previous * step),
      Math.cos(angle - previous * step),
    );
    if (Math.abs(delta) < step * 0.6) return previous;
  }
  return Math.round(normalized / step) % directions;
}
