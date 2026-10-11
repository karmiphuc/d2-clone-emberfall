import aldricMaceFrames from "../assets/rigged/aldricmace.json" with { type: "json" };
import ilyraFrames from "../assets/rigged/ilyra.json" with { type: "json" };
import eiraFrames from "../assets/rigged/eira.json" with { type: "json" };
import sorenFrames from "../assets/rigged/soren.json" with { type: "json" };
import aldricFrames from "../assets/rigged/aldric.json" with { type: "json" };
import nyxFrames from "../assets/rigged/nyx.json" with { type: "json" };
import fallenFrames from "../assets/rigged/fallen.json" with { type: "json" };
import risenFrames from "../assets/rigged/risen.json" with { type: "json" };
import bruteFrames from "../assets/rigged/brute.json" with { type: "json" };
import gravewardenFrames from "../assets/rigged/gravewarden.json" with { type: "json" };
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
function cast(frames, url, key) {
  return {
    directions: frames.directions,
    walkFrames: frames.clips.walk[0].length,
    attackFrames: 17,
    size: frames.unitsPerPixel * 256,
    stride: frames.stride,
    shadowSize: key === "monsters" ? 2.2 : 2.75,
    sets: { [key]: { url, frames } },
  };
}
export const RIGGED_SPRITES = {
  Ilyra: cast(
    ilyraFrames,
    new URL("../assets/rigged/ilyra.webp", import.meta.url).href,
    "a",
  ),
  Eira: cast(
    eiraFrames,
    new URL("../assets/rigged/eira.webp", import.meta.url).href,
    "a",
  ),
  Soren: cast(
    sorenFrames,
    new URL("../assets/rigged/soren.webp", import.meta.url).href,
    "b",
  ),
  Aldric: cast(
    aldricFrames,
    new URL("../assets/rigged/aldric.webp", import.meta.url).href,
    "b",
  ),
  Nyx: cast(
    nyxFrames,
    new URL("../assets/rigged/nyx.webp", import.meta.url).href,
    "b",
  ),
  Fallen: cast(
    fallenFrames,
    new URL("../assets/rigged/fallen.webp", import.meta.url).href,
    "monsters",
  ),
  Risen: cast(
    risenFrames,
    new URL("../assets/rigged/risen.webp", import.meta.url).href,
    "monsters",
  ),
  Brute: cast(
    bruteFrames,
    new URL("../assets/rigged/brute.webp", import.meta.url).href,
    "monsters",
  ),
  Gravewarden: cast(
    gravewardenFrames,
    new URL("../assets/rigged/gravewarden.webp", import.meta.url).href,
    "monsters",
  ),

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
RIGGED_SPRITES.Brute.shadowSize = 3;
RIGGED_SPRITES.Gravewarden.shadowSize = 2.5;
RIGGED_SPRITES.Aldric.sets.bMace = {
  url: new URL("../assets/rigged/aldricmace.webp", import.meta.url).href,
  frames: aldricMaceFrames,
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

// Windup ends on the release pose; death uses a separate non-looping action.
export function riggedClipSample(data, pose, sample, frames) {
  if (data.deathTime > 0 && frames.clips.death)
    return {
      clip: "death",
      row: Math.min(
        32,
        Math.max(0, Math.floor((1 - data.deathTime / 1.2) * 32)),
      ),
    };
  if (data.windup > 0 && frames.clips.windup)
    return {
      clip: "windup",
      row: Math.min(
        32,
        Math.max(
          0,
          Math.floor(
            (1 - data.windup / (data.windupDuration || data.windup)) * 32,
          ),
        ),
      ),
    };
  return { clip: pose.clip, row: pose.clip === "idle" ? 0 : sample.row };
}
