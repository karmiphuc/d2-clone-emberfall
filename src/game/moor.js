// Shared world footprint, landmarks and optional packs. Stable IDs preserve saves.
export const MOOR_BOUNDS = { minX: -42, maxX: 42, minZ: -34, maxZ: 34 };
export const LOCAL_BOUNDS = { minX: -18.2, maxX: 18.2, minZ: -14, maxZ: 14 };
export const MOOR_OBJECTIVE_IDS = [
  ...Array.from({ length: 6 }, (_, i) => `fallen-${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `risen-${i + 1}`),
  "brute",
];
export const huntCount = (ids) =>
  MOOR_OBJECTIVE_IDS.filter((id) => ids.includes(id)).length;
export const huntComplete = (ids) =>
  huntCount(ids) === MOOR_OBJECTIVE_IDS.length;
export const MOOR_REGIONS = [
  { id: "westfield", name: "Forsaken Fields", x: -30, z: 18, kind: "camp" },
  { id: "thicket", name: "Briar Thicket", x: -32, z: -4, kind: "wood" },
  { id: "graves", name: "Old Burial Ground", x: -29, z: -23, kind: "graves" },
  { id: "stones", name: "Broken Watch", x: -10, z: -26, kind: "ruins" },
  { id: "northcamp", name: "Cinder Camp", x: 11, z: -26, kind: "camp" },
  { id: "eastgraves", name: "Hollow Graves", x: 31, z: -23, kind: "graves" },
  { id: "eastwatch", name: "East Watch Ruins", x: 31, z: -5, kind: "ruins" },
  { id: "southcamp", name: "Carrion Hollow", x: 29, z: 18, kind: "camp" },
  { id: "southfield", name: "Windworn Fields", x: 9, z: 25, kind: "wood" },
  { id: "cartroad", name: "Lost Caravan", x: -10, z: 25, kind: "wagon" },
];
const offsets = [
  [-2.8, -1.8],
  [0, -2.8],
  [2.8, -1.5],
  [-2.4, 1.5],
  [0, 2.6],
  [2.8, 1.4],
  [-5.3, 0],
  [5.2, 0],
  [-1, 5.5],
  [2, -5.3],
];
export const MOOR_BOSSES = {
  graves: {
    name: "Mournfang",
    archetype: "Gravewarden",
    behavior: "duelist",
    reward: "mourning_seal",
    hp: 330,
  },
  northcamp: {
    name: "Cinderhorn",
    archetype: "Brute",
    behavior: "crusher",
    reward: "cinderbrand",
    hp: 360,
  },
  eastwatch: {
    name: "The Oathbreaker",
    archetype: "Gravewarden",
    behavior: "duelist",
    reward: "oathbreaker_mace",
    hp: 420,
  },
  southcamp: {
    name: "Carrion King",
    archetype: "Brute",
    behavior: "crusher",
    reward: "carrion_plate",
    hp: 460,
  },
  thicket: {
    name: "Thornwitch",
    archetype: "Fallen",
    behavior: "ember",
    reward: "thornwood_bow",
    hp: 260,
  },
  eastgraves: {
    name: "Hollow Seer",
    archetype: "Risen",
    behavior: "ember",
    reward: "hollow_staff",
    hp: 300,
  },
};
export const MOOR_EXTRA_ENCOUNTERS = MOOR_REGIONS.flatMap((region, r) =>
  offsets.map(([dx, dz], i) => {
    const boss = i === 9 ? MOOR_BOSSES[region.id] : null;
    const elite = !!boss || (i === 5 && [2, 4, 6, 7].includes(r));
    const risen = region.kind === "graves" || (i === 4 && r % 2 === 0);
    const caster = !elite && i === 7;
    const champion = !elite && i === 8;
    return {
      id: `${region.id}-${i + 1}`,
      name:
        boss?.name ||
        (elite
          ? "Ashen Brute"
          : caster
            ? "Embercaller"
            : champion
              ? "Risen Bulwark"
              : risen
                ? "Risen"
                : i === 6
                  ? "Fallen Raider"
                  : "Fallen"),
      archetype:
        boss?.archetype ||
        (elite ? "Brute" : champion || (risen && !caster) ? "Risen" : "Fallen"),
      behavior:
        boss?.behavior || (caster ? "ember" : elite ? "crusher" : "melee"),
      reward: boss?.reward,
      boss: !!boss,
      champion,
      armor: champion ? 0.25 : 0,
      x: region.x + dx,
      z: region.z + (region.id === "cartroad" && i === 9 ? -dz : dz),
      hp:
        boss?.hp ||
        (elite ? 190 : champion ? 115 : caster ? 60 : risen ? 62 : 42),
      damage: boss
        ? 26
        : elite
          ? 20
          : champion
            ? 14
            : caster
              ? 12
              : risen
                ? 11
                : 8,
      speed:
        boss?.behavior === "duelist"
          ? 1.65
          : risen || champion
            ? 1.1
            : elite
              ? 1.25
              : i === 6
                ? 2.2
                : 1.65,
      gold: boss
        ? 95
        : elite
          ? 45
          : champion
            ? 28
            : caster
              ? 22
              : risen
                ? 16
                : 12,
      elite,
      patrol: !boss,
      region: region.id,
    };
  }),
);
