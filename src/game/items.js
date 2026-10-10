import { levelOf } from "./progression.js";
import { COMPANIONS } from "./companions.js";
export const ITEMS = {
  worn_sword: {
    name: "Worn longsword",
    slot: "weapon",
    rarity: "common",
    level: 1,
    damage: 9,
    value: 8,
  },
  tempered_sword: {
    name: "Tempered longsword",
    slot: "weapon",
    rarity: "common",
    level: 1,
    damage: 15,
    value: 35,
  },
  iron_axe: {
    name: "Iron handaxe",
    slot: "weapon",
    rarity: "common",
    level: 1,
    damage: 12,
    value: 18,
  },
  hunters_blade: {
    name: "Hunter’s blade",
    slot: "weapon",
    rarity: "magic",
    level: 2,
    damage: 16,
    life: 8,
    value: 40,
  },
  frost_edge: {
    name: "Frost-edged saber",
    slot: "weapon",
    rarity: "magic",
    level: 3,
    damage: 20,
    mana: 10,
    value: 65,
  },
  ember_cleaver: {
    name: "Ember cleaver",
    slot: "weapon",
    rarity: "rare",
    level: 4,
    damage: 25,
    life: 12,
    value: 90,
  },
  dawnsteel: {
    name: "Dawnsteel",
    slot: "weapon",
    rarity: "rare",
    level: 5,
    damage: 29,
    mana: 15,
    value: 120,
  },
  traveler_coat: {
    name: "Traveler’s coat",
    slot: "armor",
    rarity: "common",
    level: 1,
    armor: 0,
    value: 5,
  },
  leather_vest: {
    name: "Stitched leather",
    slot: "armor",
    rarity: "common",
    level: 1,
    armor: 5,
    life: 6,
    value: 18,
  },
  quilted_coat: {
    name: "Quilted coat",
    slot: "armor",
    rarity: "common",
    level: 1,
    armor: 3,
    life: 15,
    value: 20,
  },
  wardens_mail: {
    name: "Warden’s mail",
    slot: "armor",
    rarity: "magic",
    level: 2,
    armor: 9,
    life: 12,
    value: 45,
  },
  mystic_robe: {
    name: "Mystic robe",
    slot: "armor",
    rarity: "magic",
    level: 3,
    armor: 5,
    mana: 25,
    value: 60,
  },
  iron_bastion: {
    name: "Iron bastion",
    slot: "armor",
    rarity: "rare",
    level: 4,
    armor: 15,
    life: 24,
    value: 85,
  },
  duskplate: {
    name: "Duskplate",
    slot: "armor",
    rarity: "rare",
    level: 5,
    armor: 18,
    life: 35,
    value: 110,
  },
  copper_band: {
    name: "Copper band",
    slot: "ring",
    rarity: "common",
    level: 1,
    life: 10,
    value: 15,
  },
  focus_ring: {
    name: "Ring of focus",
    slot: "ring",
    rarity: "magic",
    level: 1,
    mana: 12,
    value: 22,
  },
  soldiers_ring: {
    name: "Soldier’s ring",
    slot: "ring",
    rarity: "magic",
    level: 2,
    damage: 2,
    armor: 3,
    value: 40,
  },
  azure_seal: {
    name: "Azure seal",
    slot: "ring",
    rarity: "magic",
    level: 3,
    mana: 20,
    damage: 2,
    value: 60,
  },
  ruby_signet: {
    name: "Ruby signet",
    slot: "ring",
    rarity: "rare",
    level: 4,
    life: 25,
    damage: 3,
    value: 80,
  },
  oath_ring: {
    name: "Oathkeeper’s ring",
    slot: "ring",
    rarity: "rare",
    level: 5,
    armor: 7,
    damage: 4,
    value: 110,
  },
  river_stone: {
    name: "River-stone charm",
    slot: "charm",
    rarity: "common",
    level: 1,
    life: 8,
    value: 12,
  },
  owls_feather: {
    name: "Owl’s feather",
    slot: "charm",
    rarity: "magic",
    level: 1,
    mana: 10,
    value: 20,
  },
  ashen_charm: {
    name: "Ashen charm",
    slot: "charm",
    rarity: "rare",
    level: 1,
    damage: 3,
    value: 65,
  },
  wolf_fang: {
    name: "Wolf-fang charm",
    slot: "charm",
    rarity: "magic",
    level: 2,
    damage: 2,
    life: 8,
    value: 38,
  },
  warding_idol: {
    name: "Warding idol",
    slot: "charm",
    rarity: "magic",
    level: 3,
    armor: 5,
    life: 12,
    value: 55,
  },
  sun_fragment: {
    name: "Sun fragment",
    slot: "charm",
    rarity: "rare",
    level: 4,
    damage: 4,
    mana: 12,
    value: 80,
  },
  ancient_talisman: {
    name: "Ancient talisman",
    slot: "charm",
    rarity: "rare",
    level: 5,
    damage: 5,
    life: 20,
    value: 115,
  },
  hunting_bow: {
    name: "Yew hunting bow",
    slot: "weapon",
    weaponType: "bow",
    rarity: "common",
    level: 1,
    damage: 5,
    value: 20,
  },
  frost_bow: {
    name: "Frostwind bow",
    slot: "weapon",
    weaponType: "bow",
    rarity: "magic",
    level: 3,
    damage: 13,
    life: 8,
    value: 60,
    element: "frost",
  },
  iron_mace: {
    name: "Iron flanged mace",
    slot: "weapon",
    weaponType: "mace",
    rarity: "common",
    level: 1,
    damage: 5,
    value: 20,
  },
  oath_hammer: {
    name: "Oath hammer",
    slot: "weapon",
    weaponType: "mace",
    rarity: "rare",
    level: 4,
    damage: 18,
    armor: 3,
    value: 85,
    element: "holy",
  },
  renewal_staff: {
    name: "Staff of renewal",
    slot: "weapon",
    weaponType: "staff",
    rarity: "common",
    level: 1,
    damage: 3,
    healing: 6,
    value: 24,
  },
  glacial_staff: {
    name: "Glacial staff",
    slot: "weapon",
    weaponType: "staff",
    rarity: "magic",
    level: 3,
    damage: 12,
    healing: 4,
    value: 60,
    element: "frost",
  },
  steel_daggers: {
    name: "Paired steel daggers",
    slot: "weapon",
    weaponType: "daggers",
    rarity: "common",
    level: 1,
    damage: 5,
    value: 20,
  },
  nightfang: {
    name: "Nightfang daggers",
    slot: "weapon",
    weaponType: "daggers",
    rarity: "rare",
    level: 4,
    damage: 18,
    life: 8,
    value: 85,
    element: "shadow",
  },
};
for (const [id, item] of Object.entries(ITEMS))
  if (item.slot === "weapon" && !item.weaponType)
    item.weaponType = ["iron_axe", "ember_cleaver"].includes(id)
      ? "axe"
      : "sword";
export const VENDOR_STOCK = [
  "hunting_bow",
  "iron_mace",
  "renewal_staff",
  "steel_daggers",
  "frost_bow",
  "glacial_staff",
  "oath_hammer",
  "nightfang",
  "leather_vest",
  "focus_ring",
  "copper_band",
  "hunters_blade",
  "wardens_mail",
  "frost_edge",
  "mystic_robe",
  "ember_cleaver",
  "iron_bastion",
  "dawnsteel",
  "oath_ring",
];
export const BAG_LIMIT = 60;
export function starterEquipment() {
  return {
    weapon: { uid: "starter-weapon", itemId: "worn_sword" },
    armor: { uid: "starter-armor", itemId: "traveler_coat" },
    ring: null,
    charm: null,
  };
}
export function itemStats(item) {
  return (
    ["damage", "life", "mana", "armor", "healing"]
      .filter((k) => item[k])
      .map(
        (k) =>
          `${item[k] > 0 ? "+" : ""}${item[k]}${k === "armor" ? "%" : ""} ${k}`,
      )
      .join(" · ") || "No bonuses"
  );
}
export function heroStats(state) {
  const level = levelOf(state),
    gear = Object.values(state.equipment)
      .map((i) => ITEMS[i?.itemId])
      .filter(Boolean),
    sum = (k) => gear.reduce((n, i) => n + (i[k] || 0), 0);
  return {
    level,
    damage: sum("damage") + 2 * (level - 1) + 2 * (state.skills.mastery || 0),
    life:
      120 + 18 * (level - 1) + sum("life") + 15 * (state.skills.vitality || 0),
    mana: 60 + 5 * (level - 1) + sum("mana"),
    armor: Math.min(45, sum("armor")),
    regen: 3 + (state.skills.flow || 0),
  };
}
export function freshCompanionEquipment() {
  return Object.fromEntries(
    Object.keys(COMPANIONS).map((id) => [
      id,
      { weapon: null, armor: null, ring: null, charm: null },
    ]),
  );
}
export function allEquipment(state) {
  return [
    ...Object.values(state.equipment),
    ...Object.values(state.companionEquipment || {}).flatMap((gear) =>
      Object.values(gear),
    ),
  ].filter(Boolean);
}
export function canEquipItem(owner, item) {
  if (!item) return false;
  if (owner !== "hero" && !Object.hasOwn(COMPANIONS, owner)) return false;
  if (item.slot !== "weapon") return true;
  const types = {
    hero: ["sword", "axe"],
    Ilyra: ["bow"],
    Bram: ["mace"],
    Eira: ["staff"],
    Soren: ["staff"],
    Aldric: ["sword", "mace"],
    Nyx: ["daggers"],
  };
  return types[owner].includes(item.weaponType);
}
export function companionStats(state, id) {
  const base = COMPANIONS[id];
  if (!base) return null;
  const gear = Object.values(state.companionEquipment?.[id] || {})
    .map((i) => ITEMS[i?.itemId])
    .filter(Boolean);
  const sum = (k) => gear.reduce((n, i) => n + (i[k] || 0), 0),
    level = levelOf(state);
  return {
    life: base.hp + (level - 1) * 12 + sum("life"),
    damage: base.damage + (level - 1) * 2 + sum("damage"),
    armor: Math.min(45, sum("armor")),
    healing: 22 + level * 3 + sum("healing") + Math.floor(sum("mana") / 3),
    cooldownMultiplier: 1 - Math.min(0.2, sum("mana") * 0.003),
  };
}
export function equipItem(state, uid, owner = "hero") {
  const i = state.inventory.findIndex((i) => i.uid === uid);
  if (i < 0) return false;
  const item = state.inventory[i],
    def = ITEMS[item.itemId];
  if (!def || def.level > levelOf(state) || !canEquipItem(owner, def))
    return false;
  const gear =
    owner === "hero" ? state.equipment : state.companionEquipment?.[owner];
  if (!gear) return false;
  const old = gear[def.slot];
  state.inventory.splice(i, 1);
  gear[def.slot] = item;
  if (old) state.inventory.push(old);
  return true;
}
export function unequipItem(state, slot, owner) {
  const gear = state.companionEquipment?.[owner];
  if (!gear?.[slot] || state.inventory.length >= BAG_LIMIT) return false;
  state.inventory.push(gear[slot]);
  gear[slot] = null;
  return true;
}
export function sellItem(state, uid) {
  const i = state.inventory.findIndex((i) => i.uid === uid);
  if (i < 0) return false;
  state.gold += ITEMS[state.inventory[i].itemId].value;
  state.inventory.splice(i, 1);
  return true;
}
export function buyItem(state, id) {
  const def = ITEMS[id],
    price = def?.value * 3;
  if (
    !VENDOR_STOCK.includes(id) ||
    state.gold < price ||
    state.inventory.length >= BAG_LIMIT
  )
    return false;
  state.gold -= price;
  do {
    state.itemSerial++;
  } while (
    [...state.inventory, ...allEquipment(state)].some(
      (i) => i?.uid === `shop-${state.itemSerial}`,
    )
  );
  state.inventory.push({ uid: `shop-${state.itemSerial}`, itemId: id });
  return true;
}
export function lootItem(state, enemyId, index, elite = false) {
  if (elite && state.run === 0)
    return { uid: `loot-${state.run}-${enemyId}`, itemId: "ashen_charm" };
  const pool = Object.entries(ITEMS).filter(
    ([id, item]) =>
      ![
        "worn_sword",
        "traveler_coat",
        "tempered_sword",
        "ashen_charm",
      ].includes(id) && item.level <= Math.min(6, levelOf(state) + 1),
  );
  const selected = pool[(state.run * 7 + index * 5) % pool.length];
  return { uid: `loot-${state.run}-${enemyId}`, itemId: selected[0] };
}
export function addLoot(state, item) {
  if (
    state.inventory.some((i) => i.uid === item.uid) ||
    allEquipment(state).some((i) => i?.uid === item.uid)
  )
    return false;
  if (state.inventory.length >= BAG_LIMIT) {
    state.gold += ITEMS[item.itemId].value;
    return "sold";
  }
  state.inventory.push(item);
  return true;
}
