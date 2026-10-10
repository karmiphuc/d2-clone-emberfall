// Authored dungeon footprint shared by collision, scenery and the map.
export const DEN_ROOMS = [
  { x: -12, z: 8, w: 10, d: 10 },
  { x: -2, z: 7, w: 12, d: 4 },
  { x: 7, z: 5, w: 12, d: 12 },
  { x: 7, z: -3, w: 4, d: 10 },
  { x: 5, z: -9, w: 18, d: 8 },
];
export const DEN_GATE = { x: 15, z: -10 };
export const DEN_EXIT = { x: -14, z: 10 };
export function denWalkable(x, z, margin = 0) {
  return DEN_ROOMS.some(
    (r) =>
      Math.abs(x - r.x) <= r.w / 2 - margin &&
      Math.abs(z - r.z) <= r.d / 2 - margin,
  );
}
export const DEN_ENCOUNTERS = [
  [-10, 6, "Fallen"],
  [-9, 4, "Fallen"],
  [-13, 4, "Risen"],
  [3, 7, "Fallen"],
  [7, 7, "Fallen"],
  [10, 4, "Risen"],
  [8, 1, "Risen"],
  [7, -5, "Fallen"],
  [2, -8, "Risen"],
  [10, -9, "Risen"],
  [5, -10, "Gravewarden"],
].map(([x, z, name], i) => ({
  id: `den-${i + 1}`,
  name,
  x,
  z,
  hp: name === "Gravewarden" ? 240 : name === "Risen" ? 66 : 46,
  damage: name === "Gravewarden" ? 25 : name === "Risen" ? 12 : 9,
  speed: name === "Fallen" ? 1.65 : 1.1,
  gold: name === "Gravewarden" ? 75 : 18,
  elite: name === "Gravewarden",
}));
export const freshDen = () => ({
  defeated: [],
  lootTaken: [],
  dropLocations: {},
  dropItems: {},
  entered: false,
  rewardClaimed: false,
});
export function claimDenReward(state) {
  const den = state.den;
  if (
    den.rewardClaimed ||
    !DEN_ENCOUNTERS.every((e) => den.defeated.includes(e.id))
  )
    return false;
  den.rewardClaimed = true;
  state.gold += 175;
  state.potions += 3;
  return true;
}
