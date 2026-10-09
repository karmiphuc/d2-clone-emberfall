export const LEVEL_XP = [0, 80, 220, 450, 760, 1150];
export const LEVEL_CAP = LEVEL_XP.length;
export function levelOf(state) {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++)
    if (state.xp >= LEVEL_XP[i]) level = i + 1;
  return level;
}
export const TALENTS = {
  vitality: {
    name: "Vitality",
    branch: "Vanguard",
    max: 3,
    level: 1,
    description: "+15 maximum life per rank.",
  },
  ironSkin: {
    name: "Iron Skin",
    branch: "Vanguard",
    max: 2,
    level: 3,
    requires: "vitality",
    description: "Take 8% less damage per rank.",
  },
  lastStand: {
    name: "Last Stand",
    branch: "Vanguard",
    max: 1,
    level: 5,
    requires: "ironSkin",
    description: "+15 damage while below 40% life.",
  },
  mastery: {
    name: "Weapon Mastery",
    branch: "Slayer",
    max: 3,
    level: 1,
    description: "+2 weapon damage per rank.",
  },
  wideArc: {
    name: "Wide Arc",
    branch: "Slayer",
    max: 2,
    level: 3,
    requires: "mastery",
    description: "Cleave gains 0.6 reach and 15% damage per rank.",
  },
  executioner: {
    name: "Executioner",
    branch: "Slayer",
    max: 1,
    level: 5,
    requires: "wideArc",
    description: "Deal 35% more damage to enemies below 35% life.",
  },
  flow: {
    name: "Battle Flow",
    branch: "Tactician",
    max: 3,
    level: 1,
    description: "Regenerate 1 additional mana per second per rank.",
  },
  bulwark: {
    name: "Bulwark",
    branch: "Tactician",
    max: 2,
    level: 3,
    requires: "flow",
    description: "Guard lasts 1 additional second per rank.",
  },
  battleCry: {
    name: "Battle Cry",
    branch: "Tactician",
    max: 1,
    level: 5,
    requires: "bulwark",
    description:
      "Rally [3] heals living allies for 25 life. Costs 15 mana; 12-second cooldown.",
  },
};
export function skillPoints(state) {
  return (
    1 +
    (levelOf(state) - 1) * 2 -
    Object.values(state.skills || {}).reduce((a, b) => a + b, 0)
  );
}
export function talentLock(state, key) {
  const t = TALENTS[key];
  if (!t) return "Unknown talent";
  if ((state.skills[key] || 0) >= t.max) return "Maximum rank";
  if (levelOf(state) < t.level) return `Requires level ${t.level}`;
  if (t.requires && !state.skills[t.requires])
    return `Requires ${TALENTS[t.requires].name}`;
  if (skillPoints(state) <= 0) return "No unspent points";
  return "";
}
export function trainTalent(state, key) {
  if (talentLock(state, key)) return false;
  state.skills[key] = (state.skills[key] || 0) + 1;
  return true;
}
export function respec(state) {
  state.skills = {};
}
export function xpProgress(state) {
  const level = levelOf(state);
  return level === LEVEL_CAP
    ? { level, current: 0, needed: 0, percent: 100 }
    : {
        level,
        current: state.xp - LEVEL_XP[level - 1],
        needed: LEVEL_XP[level] - LEVEL_XP[level - 1],
        percent:
          ((state.xp - LEVEL_XP[level - 1]) /
            (LEVEL_XP[level] - LEVEL_XP[level - 1])) *
          100,
      };
}
