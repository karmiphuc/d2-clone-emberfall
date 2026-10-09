import { ENCOUNTERS } from "./combat.js";
export const SAVE_KEY = "emberfall-camp-v1";
const names = ["Ilyra", "Bram", "Eira"];
const services = ["Charsi", "Kashya", "Stash"];
const ids = ENCOUNTERS.map((e) => e.id);
export function freshState() {
  return {
    version: 1,
    gold: 240,
    potions: 3,
    quest: false,
    visited: [],
    roster: [...names],
    weapon: false,
    stash: 0,
    defeated: [],
    lootTaken: [],
    dropLocations: {},
    xp: 0,
    charm: false,
    rewardClaimed: false,
  };
}
export function normalizeSave(raw) {
  const result = freshState();
  if (!raw || raw.version !== 1) return result;
  for (const key of ["gold", "potions", "stash", "xp"])
    if (Number.isSafeInteger(raw[key]) && raw[key] >= 0)
      result[key] = Math.min(raw[key], 999999);
  for (const key of ["quest", "weapon", "charm", "rewardClaimed"])
    result[key] = raw[key] === true;
  for (const [key, allowed] of [
    ["roster", names],
    ["visited", services],
    ["defeated", ids],
    ["lootTaken", ids],
  ])
    if (Array.isArray(raw[key]))
      result[key] = [...new Set(raw[key].filter((x) => allowed.includes(x)))];
  result.lootTaken = result.lootTaken.filter((id) =>
    result.defeated.includes(id),
  );
  for (const id of result.defeated) {
    const p = raw.dropLocations?.[id];
    if (
      p &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.z) &&
      Math.abs(p.x) <= 20 &&
      Math.abs(p.z) <= 16 &&
      !result.lootTaken.includes(id)
    )
      result.dropLocations[id] = { x: p.x, z: p.z };
  }
  return result;
}
export function claimReward(state) {
  if (state.rewardClaimed || state.defeated.length !== ENCOUNTERS.length)
    return false;
  state.rewardClaimed = true;
  state.gold += 100;
  state.potions += 2;
  return true;
}
