export const PORTRAIT_ORDER = [
  "hero",
  "Ilyra",
  "Bram",
  "Eira",
  "Soren",
  "Aldric",
  "Nyx",
];
export function portrait(id, extra = "") {
  return `<span class="portrait-art ${extra}" style="--portrait:${(Math.max(0, PORTRAIT_ORDER.indexOf(id)) * 100) / 6}%" aria-hidden="true"></span>`;
}
const icons = {
  worn_sword: 0,
  tempered_sword: 1,
  iron_axe: 2,
  hunters_blade: 3,
  frost_edge: 4,
  ember_cleaver: 5,
  dawnsteel: 6,
  traveler_coat: 7,
  leather_vest: 7,
  quilted_coat: 7,
  wardens_mail: 8,
  mystic_robe: 9,
  attack: 13,
  guard: 14,
  rally: 15,
  heal: 12,
  hold: 14,
  portal: 11,
};
export function itemIcon(id, slot = "", extra = "") {
  const merc = [
    "hunting_bow",
    "frost_bow",
    "iron_mace",
    "oath_hammer",
    "renewal_staff",
    "glacial_staff",
    "steel_daggers",
    "nightfang",
  ].indexOf(id);
  if (merc >= 0)
    return `<span class="item-art merc-weapon-art ${extra}" style="--ix:${((merc % 4) * 100) / 3}%;--iy:${Math.floor(merc / 4) * 100}%" aria-hidden="true"></span>`;
  const index =
    icons[id] ??
    (slot === "ring" ? 10 : slot === "charm" ? 11 : slot === "armor" ? 8 : 0);
  return `<span class="item-art ${extra}" style="--ix:${((index % 4) * 100) / 3}%;--iy:${(Math.floor(index / 4) * 100) / 3}%" aria-hidden="true"></span>`;
}

const talentOrder = [
  "vitality",
  "ironSkin",
  "lastStand",
  "mastery",
  "wideArc",
  "executioner",
  "flow",
  "bulwark",
  "battleCry",
];
export function talentIcon(id) {
  const index = Math.max(0, talentOrder.indexOf(id));
  return `<span class="talent-art" style="--tx:${(index % 3) * 50}%;--ty:${Math.floor(index / 3) * 50}%" aria-hidden="true"></span>`;
}
