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
];
export const MOOR_EXTRA_ENCOUNTERS = MOOR_REGIONS.flatMap((region, r) =>
  offsets.map(([dx, dz], i) => {
    const elite = i === 5 && [2, 4, 6, 7].includes(r);
    const risen = region.kind === "graves" || (i === 4 && r % 2 === 0);
    return {
      id: `${region.id}-${i + 1}`,
      name: elite ? "Ashen Brute" : risen ? "Risen" : "Fallen",
      x: region.x + dx,
      z: region.z + dz,
      hp: elite ? 150 : risen ? 52 : 34,
      damage: elite ? 18 : risen ? 10 : 7,
      speed: risen ? 1.1 : elite ? 1.25 : 1.65,
      gold: elite ? 45 : risen ? 16 : 12,
      elite,
      patrol: true,
      region: region.id,
    };
  }),
);
