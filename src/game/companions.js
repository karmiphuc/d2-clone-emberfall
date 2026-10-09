export const COMPANIONS = {
  Ilyra: {
    role: "Archer",
    symbol: "♜",
    color: "#79865b",
    style: "ranger",
    hp: 86,
    damage: 9,
    range: 7,
    cooldown: 1.1,
    special: "Volley",
    description:
      "A patient scout. Fires a three-target volley every 4 seconds.",
  },
  Bram: {
    role: "Tank",
    symbol: "⛨",
    color: "#82775f",
    style: "warrior",
    hp: 165,
    damage: 8,
    range: 2,
    cooldown: 1.1,
    special: "Challenge",
    description:
      "A veteran shield bearer. Taunts nearby enemies for 3 seconds and takes 40% less damage.",
  },
  Eira: {
    role: "Healer",
    symbol: "✧",
    color: "#9fae9b",
    style: "mage",
    hp: 90,
    damage: 4,
    range: 7,
    cooldown: 1.8,
    special: "Renewal",
    description:
      "A steadfast medic. Prioritizes the most wounded ally and heals every 3.5 seconds.",
  },
  Soren: {
    role: "Mage",
    symbol: "❄",
    color: "#7b82b0",
    style: "mage",
    hp: 78,
    damage: 11,
    range: 7,
    cooldown: 1.6,
    special: "Frostburst",
    description:
      "An impatient frost scholar. Bursts groups of enemies and slows them by 55%.",
  },
  Aldric: {
    role: "Paladin",
    symbol: "✠",
    color: "#bca369",
    style: "warrior",
    hp: 130,
    damage: 9,
    range: 2,
    cooldown: 1.2,
    special: "Sanctuary",
    description:
      "A sworn guardian. Nearby allies take 20% less damage; holy strikes restore a little life.",
  },
  Nyx: {
    role: "Assassin",
    symbol: "⚔",
    color: "#705b7c",
    style: "assassin",
    hp: 76,
    damage: 11,
    range: 1.9,
    cooldown: 0.8,
    special: "Backstab",
    description:
      "A quick-footed shadow. Flanks enemies and lands a powerful backstab every 4 seconds.",
  },
};
export function recruit(state, name) {
  if (
    !COMPANIONS[name] ||
    state.roster.includes(name) ||
    state.roster.length >= 3
  )
    return false;
  state.roster.push(name);
  return true;
}
export function dismiss(state, name) {
  const index = state.roster.indexOf(name);
  if (index < 0) return false;
  state.roster.splice(index, 1);
  return true;
}
