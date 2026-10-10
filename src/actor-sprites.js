import * as T from "three";
import { advanceMotion, motionPose } from "./animation.js";

// Original painted, directional figures retain the game's Three.js world,
// pathfinding and combat roots. Frames are ordered front-right, front-left,
// back-left, back-right; their transparent feet align with the ground plane.
const sheets = {
  npc: new URL("../public/art/npc-directions.webp", import.meta.url).href,
  monsters: new URL("../public/art/monsters.webp", import.meta.url).href,
  hero: new URL("../public/art/hero-directions.webp", import.meta.url).href,
  a: new URL("../public/art/companions-a.webp", import.meta.url).href,
  b: new URL("../public/art/companions-b.webp", import.meta.url).href,
};
const motionSheets = {
  monsters: [
    new URL("../public/art/monster-attacks.webp", import.meta.url).href,
    6,
  ],
  sword: [
    new URL("../public/art/hero-sword-motion.webp", import.meta.url).href,
    4,
  ],
  axe: [new URL("../public/art/hero-axe-motion.webp", import.meta.url).href, 4],
  a: [
    new URL("../public/art/companions-a-motion.webp", import.meta.url).href,
    6,
  ],
  b: [
    new URL("../public/art/companions-b-motion.webp", import.meta.url).href,
    6,
  ],
};
const figures = {
  Fallen: ["monsters", 0, 3],
  Risen: ["monsters", 1, 3],
  Brute: ["monsters", 2, 3],
  hero: ["hero", 0, 2],
  Ilyra: ["a", 0, 3],
  Bram: ["a", 1, 3],
  Eira: ["a", 2, 3],
  Soren: ["b", 0, 3],
  Aldric: ["b", 1, 3],
  Nyx: ["b", 2, 3],
  Akara: ["npc", 0, 3],
  Charsi: ["npc", 1, 3],
  Kashya: ["npc", 2, 3],
};
// Each atlas shares one image source/GPU allocation across its actors.
const atlasCache = new Map();
function atlasTexture(url) {
  let entry = atlasCache.get(url);
  if (!entry) {
    entry = { ready: false, waiting: new Set() };
    entry.texture = new T.TextureLoader().load(url, () => {
      entry.ready = true;
      for (const texture of entry.waiting) texture.needsUpdate = true;
      entry.waiting.clear();
    });
    entry.texture.colorSpace = T.SRGBColorSpace;
    entry.texture.magFilter = T.LinearFilter;
    entry.texture.minFilter = T.LinearFilter;
    entry.texture.generateMipmaps = false;
    atlasCache.set(url, entry);
  }
  const texture = entry.texture.clone();
  if (entry.ready) texture.needsUpdate = true;
  else entry.waiting.add(texture);
  return texture;
}
export function equipSprite(actor, weapon) {
  const d = actor.userData;
  d.weaponId = weapon;
  if (d.characterId === "hero") {
    d.spriteRow = ["iron_axe", "ember_cleaver"].includes(weapon) ? 1 : 0;
    d.motionKey = d.spriteRow ? "axe" : "sword";
    // Elemental equipment has a restrained, distinct in-world light accent.
    d.weaponLight.color.set(
      weapon === "frost_edge"
        ? "#75bfe5"
        : weapon === "dawnsteel"
          ? "#ffe6a4"
          : "#e87936",
    );
    d.weaponLight.intensity = [
      "frost_edge",
      "ember_cleaver",
      "dawnsteel",
    ].includes(weapon)
      ? 1.8
      : 0;
    d.weaponLight.visible = d.weaponLight.intensity > 0;
  }
}
export function createSpriteActor(name, weapon) {
  const [sheet, row, rows] = figures[name] || figures.hero;
  const actor = new T.Group(),
    body = new T.Group();
  const texture = atlasTexture(sheets[sheet]);
  const animationMaps = {};
  const keys =
    name === "hero"
      ? ["sword", "axe"]
      : ["a", "b", "monsters"].includes(sheet)
        ? [sheet]
        : [];
  for (const key of keys) {
    const [url, count] = motionSheets[key];
    animationMaps[key] = atlasTexture(url);
    animationMaps[key].repeat.set(0.25, 1 / count);
  }
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearFilter;
  texture.generateMipmaps = false;
  texture.repeat.set(1 / 4, 1 / rows);
  const material = new T.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.3,
    depthWrite: true,
    toneMapped: false,
  });
  const sprite = new T.Sprite(material);
  sprite.center.set(0.5, 0.06);
  const size = name === "Fallen" ? 2 : name === "Brute" ? 3.25 : 2.75;
  sprite.scale.set(size, size, 1);
  const light = new T.PointLight("#e87936", 0, 3);
  light.position.set(0.35, 1, 0.2);
  body.add(sprite);
  if (name === "hero") body.add(light);
  actor.add(body);
  actor.userData = {
    body,
    legs: [],
    arms: [new T.Group(), new T.Group()],
    weaponSlot: new T.Group(),
    weaponId: null,
    phase: 0,
    path: [],
    swing: 0,
    characterId: name,
    sprite,
    spriteRow: row,
    spriteRows: rows,
    weaponLight: light,
    renderStyle: "directional-sprite",
    moving: false,
    down: false,
    motionKey: keys[0],
    animationMaps,
    idleMap: texture,
    activeClip: "idle",
    activeRow: row,
    disposeTextures() {
      texture.dispose();
      Object.values(animationMaps).forEach((map) => map.dispose());
    },
  };
  const facing = new T.Vector3(),
    right = new T.Vector3(),
    up = new T.Vector3();
  sprite.onBeforeRender = (_renderer, _scene, camera) => {
    facing.set(Math.sin(actor.rotation.y), 0, Math.cos(actor.rotation.y));
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    const x = facing.dot(right),
      y = facing.dot(up);
    const column = y <= 0 ? (x >= 0 ? 0 : 1) : x < 0 ? 2 : 3;
    const data = actor.userData;
    const pose = motionPose(data, name === "hero" || sheet === "monsters");
    const motionMap = animationMaps[data.motionKey];
    const ready = motionMap?.image?.complete;
    const animated =
      ready &&
      (sheet === "monsters" ? pose.clip === "attack" : pose.clip !== "idle");
    const map = animated ? motionMap : texture;
    const count = animated ? motionSheets[data.motionKey][1] : rows;
    const frameRow = animated
      ? name === "hero"
        ? pose.row
        : row * 2 + pose.row - (sheet === "monsters" ? 2 : 0)
      : data.spriteRow;
    if (material.map !== map) material.map = map;
    map.offset.set(column / 4, 1 - (frameRow + 1) / count);
    const factor =
      name === "hero"
        ? 1.08
        : name === "Risen"
          ? 1.32
          : sheet === "monsters"
            ? 1.24
            : 1;
    const renderSize = size * (animated ? factor : 1);
    if (sprite.scale.x !== renderSize) {
      sprite.scale.set(renderSize, renderSize, 1);
      sprite.updateMatrixWorld();
    }
    data.activeClip = animated ? pose.clip : "idle";
    data.activeRow = frameRow;
    actor.userData.spriteFrame = column;
    material.rotation =
      body.rotation.z +
      (name !== "hero" && actor.userData.swing > 0
        ? Math.sin(actor.userData.swing * 12) * 0.12
        : 0);
  };
  equipSprite(actor, weapon);
  return actor;
}

export function updateActorMotion(actor, dt, moving = false, down = false) {
  const d = actor.userData;
  advanceMotion(d, dt, moving, down);
  d.hitFlash = Math.max(0, (d.hitFlash || 0) - dt);
  const flash = d.hitFlash / 0.13;
  d.sprite.material.color.setRGB(1 + flash * 0.7, 1 + flash * 0.3, 1);
  d.body.position.y = down
    ? 0
    : moving
      ? Math.abs(Math.sin(d.phase * Math.PI)) * 0.025
      : Math.sin(d.phase) * 0.009;
  d.body.rotation.z = down ? Math.PI / 2 : 0;
}
