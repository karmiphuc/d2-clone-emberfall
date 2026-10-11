// Source time is expressed in Blender frame numbers; materials stay fixed per actor.
const leather = [
  "leather_boots",
  "leather_chest",
  "leather_gloves",
  "leather_pants",
];
const mage = [
  "mage_boots",
  "mage_hood",
  "mage_skirt",
  "mage_sleeves",
  "mage_vest",
  "cloth_gloves",
];
const plate = [
  "plate_boots",
  "plate_cuirass",
  "plate_gauntlets",
  "plate_greaves",
  "plate_helm",
];
const release = [15, 15.35, 15.7, 16, 1];
const cast = [27, 27.3, 27.65, 28, 1];
const anticipation = [1, 13, 14, 14.65, 15];
const humanoid = {
  directions: 8,
  fps: 5,
  span: 5.6,
  scale: 1.4,
  walk: [5, 6, 7, 8, 9, 10, 11, 12, 5],
  idle: 1,
  toes: true,
};
const enemy = {
  ...humanoid,
  attack: release,
  windup: anticipation,
  death: [23, 24, 25, 26, 27, 28],
  enemy: true,
};
export const CAST_PROFILES = {
  Ilyra: {
    ...humanoid,
    source: "female",
    parts: [...leather, "head_long", "mantle", "shortbow"],
    attack: [31, 31.3, 31.65, 32, 1],
    colors: { leather: "#67734d", mantle: "#344c31", hair: "#7a4b28" },
    style: "bow",
  },
  Eira: {
    ...humanoid,
    source: "female",
    span: 6.4,
    parts: [...mage, "head_long", "mantle", "staff"],
    attack: cast,
    colors: { mage: "#c9c1a2", mantle: "#b8b49a", staff: "#b2914d" },
    style: "heal",
  },
  Soren: {
    ...humanoid,
    source: "male",
    span: 6.4,
    parts: [...mage, "head_short", "mantle", "staff"],
    attack: cast,
    colors: { mage: "#48576b", mantle: "#344050", staff: "#849eb0" },
    style: "frost",
  },
  Aldric: {
    ...humanoid,
    source: "male",
    parts: [...plate, "mantle", "longsword", "shield"],
    attack: release,
    colors: { plate: "#ad9864", mantle: "#b8ad88" },
    style: "paladin",
  },
  Nyx: {
    ...humanoid,
    source: "female",
    parts: [
      ...leather,
      "leather_hood",
      "head_long",
      "mantle",
      "dagger",
      "off_dagger",
    ],
    attack: release,
    colors: { leather: "#76647b", mantle: "#514359", hair: "#302a30" },
    style: "assassin",
  },
  Fallen: {
    ...enemy,
    attack: [23, 23, 23, 1, 1],
    windup: [1, 21, 21.5, 22, 23],
    death: [35, 36, 37, 38, 39, 40],
    source: "goblin",
    fps: 10,
    span: 5.2,
    scale: 1.55,
    stances: [
      ["Right", 0.75, 1],
      ["Left", 0.875, 1.125],
    ],
    parts: ["Goblin", "GoblinSpear"],
    colors: { skin: "#984b36" },
    style: "spear",
  },
  Risen: {
    ...enemy,
    walkFrames: 96,
    source: "zombie",
    span: 5.2,
    scale: 1.4,
    parts: ["Zombie"],
    colors: { skin: "#7e8171" },
    style: "claw",
  },
  Brute: {
    directions: 8,
    source: "minotaur",
    stances: [
      ["Right", 0.75, 1],
      ["Left", 0.25, 0.5],
    ],
    fps: 8,
    span: 8,
    scale: 1.15,
    walkFrames: 64,
    walk: [1, 2, 3, 4, 5, 6, 7, 8, 1],
    idle: 1,
    attack: [5, 6, 7, 8, 9],
    windup: [1, 2, 3, 4, 5],
    death: [1, 2, 3, 4, 5, 6, 7, 8],
    parts: ["Minotaur", "WarAxe"],
    colors: { skin: "#716157" },
    enemy: true,
    style: "heavy-axe",
  },
  Gravewarden: {
    ...enemy,
    walkFrames: 96,
    source: "skeleton",
    fps: 8,
    span: 5.6,
    scale: 1.25,
    parts: [
      "Skeleton",
      "SkullSword",
      "SpikeShield",
      "ArmorHood",
      "ArmorPauldrons",
      "ArmorShinGuards",
    ],
    colors: { armor: "#494d52", bone: "#c1b696" },
    style: "undead-king",
  },
};

// Paladin equipment changes select a separately rendered weapon on the same rig.
CAST_PROFILES.AldricMace = {
  ...CAST_PROFILES.Aldric,
  parts: CAST_PROFILES.Aldric.parts.map((p) =>
    p === "longsword" ? "mace" : p,
  ),
};
