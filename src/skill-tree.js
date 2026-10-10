import { talentIcon } from "./art.js";
import { TALENTS, talentLock } from "./game/progression.js";

export const SKILL_BRANCHES = {
  Vanguard: "Combat masteries",
  Slayer: "Combat skills",
  Tactician: "War cries",
};

function effectAt(key, rank) {
  return {
    vitality: `+${rank * 15} maximum life`,
    ironSkin: `${rank * 8}% less incoming damage`,
    lastStand: rank ? "+15 damage below 40% life" : "No low-life damage bonus",
    mastery: `+${rank * 2} weapon damage`,
    wideArc: `${(3.1 + rank * 0.6).toFixed(1)} reach · ${150 + rank * 15}% weapon damage`,
    executioner: `${100 + rank * 35}% damage against foes below 35% life`,
    flow: `+${rank} mana regenerated per second`,
    bulwark: `Guard lasts ${3 + rank} seconds`,
    battleCry: rank
      ? "Rally restores 25 life to living allies"
      : "Rally regroups the company",
  }[key];
}

export function skillTreeMarkup(state, camp, selected) {
  const chosen = TALENTS[selected],
    rank = state.skills[selected] || 0;
  const lock = talentLock(state, selected);
  const reason = !camp
    ? "Return to camp to train."
    : lock || "Ready to learn · Costs 1 point";
  return `<div class="skill-branch-nav" role="group" aria-label="Skill branches">${Object.entries(
    SKILL_BRANCHES,
  )
    .map(
      ([branch, label]) =>
        `<button data-skill-branch="${branch}" aria-pressed="${chosen.branch === branch}" aria-label="Show ${label}">${label}</button>`,
    )
    .join("")}</div>
    <div class="skill-workbench">
      <div class="talent-map" aria-label="Warrior talent paths">${Object.entries(
        SKILL_BRANCHES,
      )
        .map(
          ([branch, label]) =>
            `<section class="talent-path ${chosen.branch === branch ? "active-path" : ""}" aria-label="${label}"><h3>${label}</h3><div class="talent-path-nodes">${Object.entries(
              TALENTS,
            )
              .filter(([, t]) => t.branch === branch)
              .map(([key, t]) => {
                const learned = state.skills[key] || 0,
                  blocked = talentLock(state, key);
                return `<article class="talent-node ${learned ? "learned" : ""} ${blocked ? "locked" : "available"} ${key === selected ? "selected" : ""} ${t.requires && state.skills[t.requires] ? "linked" : ""}">
            <button class="talent-select" data-inspect-talent="${key}" aria-label="Inspect ${t.name}, rank ${learned} of ${t.max}" aria-pressed="${key === selected}" aria-controls="talent-details">${talentIcon(key)}<span class="talent-rank">${learned}/${t.max}</span><strong>${t.name}</strong></button>
            <div class="talent-node-footer"><small>Lv ${t.level}</small><button data-talent="${key}" aria-label="Learn ${t.name}" ${!camp || blocked ? "disabled" : ""}>${learned === t.max ? "Max" : "Learn"}</button></div>
          </article>`;
              })
              .join("")}</div></section>`,
        )
        .join("")}</div>
      <section id="talent-details" class="talent-details" aria-label="Selected talent" aria-live="polite">
        <div class="talent-detail-heading">${talentIcon(selected)}<div><small>${SKILL_BRANCHES[chosen.branch]}</small><h3>${chosen.name}</h3><span>Rank ${rank} of ${chosen.max}</span></div></div>
        <p>${chosen.description}</p>
        <dl class="talent-rank-effects"><div><dt>Current rank</dt><dd>${effectAt(selected, rank)}</dd></div>${rank < chosen.max ? `<div><dt>Next rank</dt><dd>${effectAt(selected, rank + 1)}</dd></div>` : ""}</dl>
        <p class="talent-requires">Requires level ${chosen.level}${chosen.requires ? ` · ${TALENTS[chosen.requires].name} rank 1` : ""}</p>
        <button class="action talent-train" data-train-selected="${selected}" aria-label="Train ${chosen.name}" ${!camp || lock ? "disabled" : ""}>${rank === chosen.max ? "Mastered" : "Learn rank " + (rank + 1)}</button>
        <p class="talent-reason">${reason}</p>
      </section>
    </div>`;
}
