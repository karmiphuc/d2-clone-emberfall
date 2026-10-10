import * as T from "three";
import sequences from "./animation-sequence-data.json";
import {
  advanceMotion,
  motionPose,
  sequenceFrames,
  facingColumn,
} from "./animation.js";
import { createMotionMaterial } from "./sprite-motion-material.js";
import { ITEMS } from "./game/items.js";

// Original painted, directional figures retain the game's Three.js world,
// pathfinding and combat roots. Frames are ordered front-right, front-left,
// back-left, back-right; their transparent feet align with the ground plane.
const shadowUrl = new URL("../public/art/contact-shadow.webp", import.meta.url)
  .href;
const sheets = {
  npc: new URL("../public/art/npc-directions.webp", import.meta.url).href,
  monsters: new URL("../public/art/monsters.webp", import.meta.url).href,
  hero: new URL("../public/art/hero-directions.webp", import.meta.url).href,
  a: new URL("../public/art/companions-a.webp", import.meta.url).href,
  b: new URL("../public/art/companions-b.webp", import.meta.url).href,
};
const motionSheets = {
  sword: [
    new URL("../public/art/hero-sword-walk-sequence.webp", import.meta.url)
      .href,
    sequences.sword,
  ],
  axe: [
    new URL("../public/art/hero-axe-walk-sequence.webp", import.meta.url).href,
    sequences.axe,
  ],
  monsters: [
    new URL("../public/art/monster-attack-sequence.webp", import.meta.url).href,
    sequences.monsters * 3,
  ],
  a: [
    new URL("../public/art/companions-a-walk-sequence.webp", import.meta.url)
      .href,
    sequences.a * 3,
  ],
  b: [
    new URL("../public/art/companions-b-walk-sequence.webp", import.meta.url)
      .href,
    sequences.b * 3,
  ],
};
motionSheets.aAttack = [
  new URL("../public/art/companions-a-attack-sequence.webp", import.meta.url)
    .href,
  sequences.aAttack * 3,
];
motionSheets.bAttack = [
  new URL("../public/art/companions-b-attack-sequence.webp", import.meta.url)
    .href,
  sequences.bAttack * 3,
];
motionSheets.swordStrike = [
  new URL("../public/art/hero-sword-attack-sequence.webp", import.meta.url)
    .href,
  sequences.swordStrike,
];
motionSheets.axeStrike = [
  new URL("../public/art/hero-axe-attack-sequence.webp", import.meta.url).href,
  sequences.axeStrike,
];
motionSheets.FallenRun = [
  new URL("../public/art/fallen-walk-sequence.webp", import.meta.url).href,
  sequences.FallenRun,
];
motionSheets.RisenRun = [
  new URL("../public/art/risen-walk-sequence.webp", import.meta.url).href,
  sequences.RisenRun,
];
motionSheets.BruteRun = [
  new URL("../public/art/brute-walk-sequence.webp", import.meta.url).href,
  sequences.BruteRun,
];
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
  if (d.characterId !== "hero") {
    const element = ITEMS[weapon]?.element;
    d.weaponLight.color.set(
      element === "frost"
        ? "#79c6e3"
        : element === "holy"
          ? "#eed399"
          : "#a486ce",
    );
    d.weaponLight.intensity = element ? 1.8 : 0;
    d.weaponLight.visible = !!element;
  }
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
      ? ["sword", "axe", "swordStrike", "axeStrike"]
      : ["a", "b", "monsters"].includes(sheet)
        ? [sheet]
        : [];
  const companion = sheet === "a" || sheet === "b";
  if (companion) keys.push(`${sheet}Attack`);
  if (sheet === "monsters") keys.push(`${name}Run`);
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
  const motionMaterial = createMotionMaterial(texture);
  const material = motionMaterial.material;
  const sprite = new T.Sprite(material);
  sprite.center.set(0.5, 0.06);
  const size = name === "Fallen" ? 2 : name === "Brute" ? 3.25 : 2.75;
  sprite.scale.set(size, size, 1);
  const light = new T.PointLight("#e87936", 0, 3);
  light.position.set(0.35, 1, 0.2);
  body.add(sprite);
  if (name === "hero" || companion) body.add(light);
  const shadowMap = atlasTexture(shadowUrl);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(size * 0.65, size * 0.5),
    new T.MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  actor.add(shadow, body);
  actor.userData = {
    body,
    shadow,
    legs: [],
    arms: [new T.Group(), new T.Group()],
    weaponSlot: new T.Group(),
    weaponId: null,
    phase: 0,
    gaitFrames: 16,
    strideLength: name === "Fallen" ? 1.6 : name === "Brute" ? 2.8 : 2.4,
    detailedMotion: name === "hero",
    attackDuration: 0.55,
    attackWindup: 0.16,
    baseSize: size,
    previousPosition: actor.position.clone(),
    previousPhase: 0,
    previousSwing: 0,
    posePosition: new T.Vector3(),
    previousPosePosition: new T.Vector3(),
    simulationPosition: actor.position.clone(),
    renderPosition: actor.position.clone(),
    renderOffset: new T.Vector3(),
    path: [],
    swing: 0,
    characterId: name,
    sprite,
    spriteRow: row,
    spriteRows: rows,
    weaponLight: light,
    renderStyle: "directional-sprite",
    moving: false,
    attackSequence: companion ? "release-recover" : "windup-strike",
    down: false,
    motionKey: keys[0],
    animationMaps,
    idleMap: texture,
    activeClip: "idle",
    activeRow: row,
    disposeTextures() {
      texture.dispose();
      shadowMap.dispose();
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
    const column = facingColumn(x, y, actor.userData.spriteFrame);
    const data = actor.userData;
    const pose = motionPose(
      data,
      name === "hero" || sheet === "monsters" || companion,
    );
    const companionAttack = companion && pose.clip === "attack";
    const richHero = name === "hero" && pose.clip === "attack";
    const monsterRun = sheet === "monsters" && pose.clip === "walk";
    const motionKey = richHero
      ? `${data.motionKey}Strike`
      : monsterRun
        ? `${name}Run`
        : companionAttack
          ? `${sheet}Attack`
          : data.motionKey;
    const motionMap = animationMaps[motionKey];
    const ready = motionMap?.image?.complete;
    const animated = ready && pose.clip !== "idle";
    const map = animated ? motionMap : texture;
    const count = animated ? motionSheets[motionKey][1] : rows;
    const frameRow = animated
      ? name === "hero" || monsterRun
        ? pose.row
        : row * 2 + pose.row - (sheet === "monsters" || companionAttack ? 2 : 0)
      : data.spriteRow;
    const sample = sequenceFrames(
      {
        ...data,
        phase: data.renderPhase ?? data.phase,
        swing: data.renderSwing ?? data.swing,
      },
      name === "hero" || sheet === "monsters" || companion,
    );
    const sequenceCount =
      sample.clip === "walk" ? 16 : name === "hero" ? 33 : 17;
    const displayRow = animated
      ? name === "hero" || monsterRun
        ? sample.row
        : row * sequenceCount + sample.row
      : data.spriteRow;
    const nextRow = animated
      ? name === "hero" || monsterRun
        ? sample.next
        : row * sequenceCount + sample.next
      : data.spriteRow;
    if (material.map !== map) material.map = map;
    map.offset.set(column / 4, 1 - (displayRow + 1) / count);
    const factor = 1;
    const renderSize = size * 1.4;
    sprite.userData.frameScale = animated ? factor : 1;
    if (sprite.scale.x !== renderSize) {
      sprite.scale.set(renderSize, renderSize, 1);
      sprite.updateMatrixWorld();
    }
    data.activeClip = animated ? pose.clip : "idle";
    data.activeRow = pose.clip === "walk" ? displayRow : frameRow;
    const blended = motionMaterial.sample({
      map,
      key: animated ? motionKey : "idle",
      row: displayRow,
      next: nextRow,
      mix: animated ? sample.mix : 0,
      column,
      count,
      clip: data.activeClip,
      factor: animated ? factor : 1,
      dt: data.renderDt,
    });
    data.blendMix = blended.mix;
    data.sequenceFrame = sample.row;
    data.sequenceLength = sequenceCount;
    data.sequenceActive = blended.sequence;
    actor.userData.spriteFrame = column;
    material.rotation = body.rotation.z;
  };
  equipSprite(actor, weapon);
  return actor;
}

export function updateActorMotion(actor, dt, moving = false, down = false) {
  const d = actor.userData;
  d.renderPhase = undefined;
  d.renderSwing = undefined;
  d.previousPhase = d.phase;
  d.previousSwing = d.swing;
  d.previousPosePosition.copy(d.posePosition);
  const distance = d.previousPosition.distanceTo(actor.position);
  // Teleports must not advance a stride; preview actors opt into nominal speed.
  d.travelDistance = d.previewMotion ? undefined : distance < 1 ? distance : 0;
  d.previousPosition.copy(actor.position);
  advanceMotion(d, dt, moving, down);
  d.hitFlash = Math.max(0, (d.hitFlash || 0) - dt);
  d.recoilTime = Math.max(0, (d.recoilTime || 0) - dt);
  const flash = d.hitFlash / 0.13,
    highlight = d.highlight || 0;
  d.sprite.material.color.setRGB(
    1 + flash * 0.55 + highlight,
    1 + flash * 0.2 + highlight * 0.75,
    1 + highlight * 0.3,
  );
  const recoil =
    Math.sin(Math.PI * Math.min(1, d.recoilTime / 0.22)) *
    (d.recoilStrength || 0);
  const attackProgress = d.swing ? 1 - d.swing / (d.attackDuration || 0.55) : 0;
  const lunge =
    d.detailedMotion && d.swing
      ? Math.sin(Math.PI * Math.min(1, attackProgress * 1.5)) * 0.12
      : 0;
  d.body.position.set(
    (d.recoilX || 0) * recoil,
    down
      ? 0
      : moving
        ? Math.abs(Math.sin(((d.phase || 0) / d.gaitFrames) * Math.PI * 2)) *
          0.016
        : Math.sin(d.idleTime) * 0.008,
    lunge + (d.recoilZ || 0) * recoil,
  );
  d.body.rotation.z = down ? Math.PI / 2 : recoil * 0.08;
  d.posePosition.copy(d.body.position);
}

export function presentActor(actor, alpha, dt) {
  const d = actor.userData;
  d.renderPosition.lerpVectors(d.simulationPosition, actor.position, alpha);
  if (d.simulationPosition.distanceToSquared(actor.position) > 1)
    d.renderPosition.copy(actor.position);
  const offset = d.renderPosition.clone().sub(actor.position);
  d.renderOffset.copy(offset);
  const c = Math.cos(actor.rotation.y),
    s = Math.sin(actor.rotation.y);
  const localOffset = new T.Vector3(
    (offset.x * c - offset.z * s) / actor.scale.x,
    0,
    (offset.x * s + offset.z * c) / actor.scale.z,
  );
  d.body.position
    .lerpVectors(d.previousPosePosition, d.posePosition, alpha)
    .add(localOffset);
  d.shadow.position.set(localOffset.x, 0.015, localOffset.z);
  d.renderPhase = d.previousPhase + (d.phase - d.previousPhase) * alpha;
  d.renderSwing = Math.max(
    0,
    d.previousSwing + (d.swing - d.previousSwing) * alpha,
  );
  d.renderDt = dt;
}
