import { questKills, replenish } from "./expedition.js";
import { MOOR_BOUNDS, MOOR_OBJECTIVE_IDS, huntComplete } from "./moor.js";
import { DEN_ENCOUNTERS, freshDen, denWalkable } from "./den.js";
import { ENCOUNTERS } from "./combat.js";
import { COMPANIONS } from "./companions.js";
import {
  ITEMS,
  starterEquipment,
  freshCompanionEquipment,
  canEquipItem,
  BAG_LIMIT,
} from "./items.js";
import { TALENTS, levelOf, skillPoints } from "./progression.js";
export const SAVE_KEY = "emberfall-camp-v1";
const services = ["Charsi", "Kashya", "Stash"],
  ids = ENCOUNTERS.map((e) => e.id);
export function freshState() {
  return {
    version: 2,
    den: freshDen(),
    gold: 240,
    potions: 3,
    quest: false,
    visited: [],
    roster: ["Ilyra", "Bram", "Eira"],
    weapon: false,
    stash: 0,
    defeated: [],
    questKills: [],
    spawnCounts: {},
    lootTaken: [],
    dropLocations: {},
    dropItems: {},
    xp: 0,
    charm: false,
    rewardClaimed: false,
    run: 0,
    skills: {},
    inventory: [],
    equipment: starterEquipment(),
    companionEquipment: freshCompanionEquipment(),
    itemSerial: 0,
  };
}
export function normalizeSave(raw) {
  const result = freshState();
  if (!raw || ![1, 2].includes(raw.version)) return result;
  for (const key of ["gold", "potions", "stash", "xp", "run", "itemSerial"])
    if (Number.isSafeInteger(raw[key]) && raw[key] >= 0)
      result[key] = Math.min(raw[key], 999999);
  for (const key of ["quest", "weapon", "charm", "rewardClaimed"])
    result[key] = raw[key] === true;
  for (const [key, allowed] of [
    ["roster", Object.keys(COMPANIONS)],
    ["visited", services],
    ["defeated", ids],
    ["lootTaken", ids],
  ])
    if (Array.isArray(raw[key]))
      result[key] = [...new Set(raw[key].filter((x) => allowed.includes(x)))];
  result.roster = result.roster.slice(0, 3);
  result.lootTaken = result.lootTaken.filter((id) =>
    result.defeated.includes(id),
  );
  result.questKills = [
    ...new Set(
      (Array.isArray(raw.questKills)
        ? raw.questKills
        : Array.isArray(raw.defeated)
          ? raw.defeated
          : []
      ).filter((id) => ids.includes(id)),
    ),
  ];
  // Earlier repeat hunts erased road kills after paying the bounty. Preserve
  // that legitimate completed quest when migrating those pre-ledger saves.
  if (!Array.isArray(raw.questKills) && result.rewardClaimed)
    result.questKills = [
      ...new Set([...result.questKills, ...MOOR_OBJECTIVE_IDS]),
    ];
  for (const id of ids)
    if (Number.isSafeInteger(raw.spawnCounts?.[id]) && raw.spawnCounts[id] >= 0)
      result.spawnCounts[id] = Math.min(999999, raw.spawnCounts[id]);
  const seen = new Set();
  const item = (value) => {
    if (
      !value ||
      typeof value.uid !== "string" ||
      !/^[a-zA-Z0-9:-]{1,100}$/.test(value.uid) ||
      !Object.hasOwn(ITEMS, value.itemId) ||
      seen.has(value.uid)
    )
      return null;
    seen.add(value.uid);
    return { uid: value.uid, itemId: value.itemId };
  };
  for (const slot of ["weapon", "armor", "ring", "charm"]) {
    const source = raw.equipment?.[slot];
    if (
      source &&
      ITEMS[source.itemId]?.slot === slot &&
      canEquipItem("hero", ITEMS[source.itemId]) &&
      ITEMS[source.itemId].level <= levelOf(result)
    ) {
      result.equipment[slot] = item(source) || result.equipment[slot];
    }
  }
  if (!raw.equipment) {
    if (result.weapon)
      result.equipment.weapon = {
        uid: "legacy-weapon",
        itemId: "tempered_sword",
      };
    if (result.charm)
      result.equipment.charm = { uid: "legacy-charm", itemId: "ashen_charm" };
  }
  // Reserve fallback equipment IDs as well, so malformed saves cannot duplicate them in the bag.
  Object.values(result.equipment)
    .filter(Boolean)
    .forEach((i) => seen.add(i.uid));
  for (const id of Object.keys(COMPANIONS))
    for (const slot of ["weapon", "armor", "ring", "charm"]) {
      const source = raw.companionEquipment?.[id]?.[slot],
        def = ITEMS[source?.itemId];
      if (
        def?.slot === slot &&
        def.level <= levelOf(result) &&
        canEquipItem(id, def)
      )
        result.companionEquipment[id][slot] = item(source);
    }
  if (Array.isArray(raw.inventory))
    result.inventory = raw.inventory
      .map(item)
      .filter(Boolean)
      .slice(0, BAG_LIMIT);
  for (const id of result.defeated) {
    const p = raw.dropLocations?.[id];
    if (
      p &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.z) &&
      p.x >= MOOR_BOUNDS.minX &&
      p.x <= MOOR_BOUNDS.maxX &&
      p.z >= MOOR_BOUNDS.minZ &&
      p.z <= MOOR_BOUNDS.maxZ &&
      !result.lootTaken.includes(id)
    )
      result.dropLocations[id] = { x: p.x, z: p.z };
    if (!result.lootTaken.includes(id)) {
      const drop = item(raw.dropItems?.[id]);
      if (drop) result.dropItems[id] = drop;
    }
  }
  const den = raw.den;
  if (den && typeof den === "object") {
    const allowed = DEN_ENCOUNTERS.map((e) => e.id);
    result.den.entered = den.entered === true;
    result.den.defeated = [
      ...new Set(
        (Array.isArray(den.defeated) ? den.defeated : []).filter((id) =>
          allowed.includes(id),
        ),
      ),
    ];
    result.den.lootTaken = [
      ...new Set(
        (Array.isArray(den.lootTaken) ? den.lootTaken : []).filter((id) =>
          result.den.defeated.includes(id),
        ),
      ),
    ];
    result.den.questKills = [
      ...new Set(
        (Array.isArray(den.questKills)
          ? den.questKills
          : Array.isArray(den.defeated)
            ? den.defeated
            : []
        ).filter((id) => allowed.includes(id)),
      ),
    ];
    for (const id of allowed)
      if (
        Number.isSafeInteger(den.spawnCounts?.[id]) &&
        den.spawnCounts[id] >= 0
      )
        result.den.spawnCounts[id] = Math.min(999999, den.spawnCounts[id]);
    result.den.rewardClaimed =
      den.rewardClaimed === true &&
      allowed.every((id) => questKills(result.den).includes(id));
    for (const id of result.den.defeated) {
      if (result.den.lootTaken.includes(id)) continue;
      const p = den.dropLocations?.[id];
      if (
        p &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.z) &&
        Math.abs(p.x) <= 20 &&
        Math.abs(p.z) <= 16 &&
        denWalkable(p.x, p.z)
      )
        result.den.dropLocations[id] = { x: p.x, z: p.z };
      const drop = item(den.dropItems?.[id]);
      if (drop) result.den.dropItems[id] = drop;
    }
  }
  for (const [key, talent] of Object.entries(TALENTS)) {
    if (
      levelOf(result) < talent.level ||
      (talent.requires && !result.skills[talent.requires])
    )
      continue;
    const requested = Number.isInteger(raw.skills?.[key]) ? raw.skills[key] : 0;
    const rank = Math.max(
      0,
      Math.min(requested, talent.max, skillPoints(result)),
    );
    if (rank) result.skills[key] = rank;
  }
  return result;
}
export function claimReward(state) {
  if (state.rewardClaimed || !huntComplete(questKills(state))) return false;
  state.rewardClaimed = true;
  state.gold += 100;
  state.potions += 2;
  return true;
}
export function newExpedition(state) {
  let renewed = false;
  for (const [progress, encounters] of [
    [state, ENCOUNTERS],
    [state.den, DEN_ENCOUNTERS],
  ])
    for (const encounter of encounters)
      renewed = replenish(progress, encounter) || renewed;
  if (renewed) state.run++;
  return renewed;
}
