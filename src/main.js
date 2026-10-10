import {
  MOOR_BOUNDS,
  MOOR_REGIONS,
  huntCount,
  huntComplete,
} from "./game/moor.js";
import {
  DEN_ENCOUNTERS,
  DEN_GATE,
  DEN_EXIT,
  DEN_ROOMS,
  claimDenReward,
} from "./game/den.js";
import { skillTreeMarkup } from "./skill-tree.js";
import { createCombatAudio } from "./combat-audio.js";
import * as THREE from "three";
import "./style.css";
import "./skill-tree.css";
import { portrait, itemIcon } from "./art.js";
import { createCharacterPreview } from "./characters.js";
import { createWorld } from "./world.js";
import { createCombat, ENCOUNTERS } from "./game/combat.js";
import {
  freshState,
  normalizeSave,
  SAVE_KEY,
  claimReward,
  newExpedition,
} from "./game/save.js";

import { COMPANIONS, recruit, dismiss } from "./game/companions.js";
import {
  LEVEL_CAP,
  levelOf,
  skillPoints,
  TALENTS,
  trainTalent,
  respec,
  xpProgress,
} from "./game/progression.js";
import {
  ITEMS,
  VENDOR_STOCK,
  BAG_LIMIT,
  heroStats,
  companionStats,
  canEquipItem,
  unequipItem,
  itemStats,
  equipItem,
  sellItem,
  buyItem,
} from "./game/items.js";

let state = freshState();
try {
  state = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
} catch {
  /* Browser storage can be unavailable. */
}
const save = () => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    toast("Browser storage unavailable. Progress lasts for this session.");
  }
};
const app = document.querySelector("#app");
app.innerHTML = `<canvas id="world" aria-label="Playable encampment. Click to move, or use WASD. Press E near a towns-person to interact."></canvas><div id="vignette"></div><div class="labels" id="labels"></div>
<header class="top"><div><div class="brand">EMBERFALL</div><div class="edition">CHAPTER I · EARLY PLAYTEST</div></div><div class="place"><div class="eyebrow">The western kingdoms</div><h1>Rogue Encampment</h1><div class="safe">SANCTUARY</div></div><div class="top-actions"><button class="icon-button optional" id="sound" title="Toggle sound" aria-label="Toggle sound">Sound</button><button class="icon-button" id="help" title="Controls" aria-label="Controls">Help</button><button class="icon-button" id="settings" title="Settings" aria-label="Settings">Settings</button></div></header>
<aside class="party" id="party" aria-label="Your party"></aside><aside class="quest"><div class="eyebrow">Quest journal</div><h2 id="quest-title">A light in the darkness</h2><p id="quest-text">Speak to Akara.<br>Find your footing in camp.</p><button id="journal-link">OPEN JOURNAL &nbsp; [J]</button></aside>
<div class="minimap"><span class="north">N</span><div class="map-frame"><canvas id="map" width="274" height="216"></canvas></div><div class="map-caption">ROGUE ENCAMPMENT</div><div class="map-regions" aria-label="Wilderness destinations">${MOOR_REGIONS.map((r, i) => `<button data-map-region="${r.id}">${i + 1}. ${r.name}</button>`).join("")}</div></div>
<div class="controls">CLICK TO MOVE <span>·</span> WASD <span>·</span> E INTERACT <span>·</span> SPACE REGROUP</div><div class="chapter"><strong>ACT I · THE SIGHTLESS EYE</strong><span id="save-note">PROGRESS SAVED ON THIS DEVICE</span></div>
<footer class="bottom"><div class="orb-wrap"><div class="orb red">120 / 120</div><div class="orb-label">LIFE</div></div><div class="hotbar"><div class="xp-caption" id="xp-caption"></div><div class="level-bar"><i></i></div><div class="slots">${[
  ["attack", "Cleave", "8 mana"],
  ["guard", "Guard", "10 mana"],
  ["rally", "Rally", "Regroup party"],
  ["heal", "Potion", "Restore life"],
  ["hold", "Hold", "Hold / follow"],
  ["portal", "Town", "Return to camp"],
]
  .map(
    ([id, label, hint], i) =>
      `<button class="slot" data-action="${id}" title="${label} [${i + 1}] · ${hint}" aria-label="${label} [${i + 1}]">${itemIcon(id)}<kbd>${i + 1}</kbd><span class="slot-label">${label}</span><span class="slot-state" aria-hidden="true"></span>${id === "heal" ? '<small id="potions">3</small>' : ""}</button>`,
  )
  .join(
    "",
  )}</div><nav class="bar-menu"><button id="character">CHARACTER <kbd>C</kbd></button><button id="inventory">INVENTORY <kbd>I</kbd></button><button id="journal">JOURNAL <kbd>J</kbd></button><button id="party-menu">PARTY <kbd>P</kbd></button><button id="skills-menu">SKILLS <kbd>K</kbd></button><button id="map-menu" aria-label="Area map" aria-expanded="false">MAP <kbd>M</kbd></button></nav></div><div class="orb-wrap"><div class="orb blue">60 / 60</div><div class="orb-label">MANA</div></div></footer><button id="return-camp" class="return-camp" hidden>Return to camp [6]</button><div id="combat-status" aria-label="Combat status" hidden></div><div id="target-info" class="target-info" hidden></div><div id="combat-labels" class="labels"></div><div id="loot-labels" class="labels"></div><div id="damage-numbers" class="labels"></div><div class="toast" role="status" id="toast"></div><div class="level-up" id="level-up" role="status" hidden></div><dialog id="dialog" aria-labelledby="dialog-title"><button class="close" aria-label="Close dialog">Close <kbd>Esc</kbd></button><div id="dialog-content"></div></dialog>`;
const dialog = document.querySelector("dialog"),
  content = document.querySelector("#dialog-content");
let toastTimer, levelTimer, preview;
function clearPreview() {
  preview?.dispose();
  preview = null;
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
}
function modal(title, body, actions = [], eyebrow = "Rogue Encampment") {
  clearPreview();
  dialog.classList.remove(
    "wide",
    "inventory-dialog",
    "skills-dialog",
    "company-dialog",
  );
  content.innerHTML = `<div class="eyebrow">${eyebrow}</div><h2 id="dialog-title">${title}</h2>${body}<div id="actions"></div>`;
  for (const a of actions) {
    let b = document.createElement("button");
    b.className = "action";
    b.textContent = a.label;
    b.disabled = !!a.disabled;
    b.onclick = a.run;
    document.querySelector("#actions").append(b);
  }
  if (!dialog.open) dialog.showModal();
}
document.querySelector(".close").onclick = () => dialog.close();
dialog.addEventListener("close", clearPreview);
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
let game;
try {
  game = createWorld(document.querySelector("#world"));
} catch (e) {
  app.innerHTML =
    '<div class="error"><h1>WebGL is unavailable</h1><p>Open this game in a browser with hardware acceleration enabled.</p></div>';
  throw e;
}
const { hero, companions, npcs, camera, renderer } = game;
let combat = createCombat(state, combatEvent, game.blocked, game.route);
let combatArea = "moor";
game.setCombat(combat);
const damageNumbers = [];
let combatSound;
game.onPracticeStrike = () => {
  combatSound?.({ type: "swing" });
  game.combatVisual({ type: "swing", id: "hero", cleave: true });
};
function combatEvent(event) {
  if (event.type === "prepare")
    game.animateAttack(event.id, event.target, event.duration, event.windup);
  if (event.type === "cancelStrike") game.hero.userData.swing = 0;
  game.combatVisual(event);
  combatSound?.(event);
  if (event.type === "windup") game.animateAttack(event.id, event.target, 0);
  if (event.type === "enemyAttack")
    game.animateAttack(event.id, event.target, 0.26);
  if (event.type === "swing") {
    if (event.id === "hero") game.releaseAttack(event.duration);
    else game.animateAttack(event.id, event.target, 0.26);
  }
  if (event.type === "hit") {
    const el = document.createElement("span");
    el.className = "damage-number" + (event.victim === "hero" ? " taken" : "");
    el.textContent = Math.round(event.damage);
    document.querySelector("#damage-numbers").append(el);
    const lane = damageNumbers.filter((d) => d.victim === event.victim).length;
    damageNumbers.push({
      el,
      victim: event.victim,
      x: event.x,
      z: event.z,
      life: 0.9,
      offset: ((lane % 3) - 1) * 32,
      lift: Math.floor(lane / 3) * 0.35,
    });
  }
  if (event.type === "level") {
    const banner = document.querySelector("#level-up");
    banner.textContent = `Level ${event.level} · 2 talent points gained [K]`;
    banner.hidden = false;
    clearTimeout(levelTimer);
    levelTimer = setTimeout(() => (banner.hidden = true), 4500);
    update();

    toast(`Level ${event.level}! Two talent points gained. Train in camp [K].`);
  }
  if (event.type === "special") {
    const ally = combat.allies.find((a) => a.id === event.id);
    if (ally) {
      const el = document.createElement("span");
      el.className = "damage-number special";
      el.textContent = event.name;
      document.querySelector("#damage-numbers").append(el);
      damageNumbers.push({ el, x: ally.x, z: ally.z, life: 1.2 });
    }
  }
  if (event.type === "kill") {
    update();
    if (event.complete)
      toast(
        game.zone === "den"
          ? "The Den is clear. Gather the spoils and return to Akara."
          : state.rewardClaimed
            ? "Road hunt cleared. Collect the road drops, then start a fresh hunt at the eastern gate."
            : "The old road is clear. Return to Akara or explore the outer regions.",
      );
  }
  if (event.type === "loot") {
    update();
    toast(
      `${event.item}${event.sold ? " sold automatically (bag full)" : ""} · ${event.gold} gold`,
    );
  }
  if (event.type === "heal") {
    if (event.source) game.animateAttack(event.source, event.id, 0.26);
    save();
  }
  if (event.type === "down" && event.id !== "hero")
    toast(`${event.id} is down. Return to camp to revive your company.`);
  if (event.type === "defeat")
    queueMicrotask(() => {
      const loss = Math.min(25, Math.floor(state.gold * 0.1));
      state.gold -= loss;
      returnToCamp();
      update();
      modal(
        "The company retreats",
        `<p>Your companions carried you back to safety. You lost ${loss} gold; your equipment and expedition progress are intact.</p>`,
        [{ label: "Rest at camp", run: () => dialog.close() }],
      );
    });
}
function refreshEnemyLabels() {
  const container = document.querySelector("#combat-labels");
  container.replaceChildren();
  for (const enemy of combat.enemies) {
    const el = document.createElement("button");
    el.className = "enemy-label" + (enemy.elite ? " elite" : "");
    el.setAttribute("aria-label", `Attack ${enemy.name} ${enemy.id}`);
    el.innerHTML = `<span>${enemy.name}</span><i><b></b></i>`;
    el.onclick = () => {
      pending = null;
      combat.select(enemy.id);
    };
    el.onpointerenter = () => {
      game.hoveredEnemy = enemy.id;
    };
    el.onpointerleave = () => {
      if (game.hoveredEnemy === enemy.id) game.hoveredEnemy = null;
    };
    el.oncontextmenu = (event) => {
      event.preventDefault();
      game.onSecondaryAttack?.(enemy.id);
    };
    container.append(el);
    enemy.label = el;
  }
}
function installArea(zone) {
  if (combatArea === zone) return;
  combat.setArea(
    zone === "den" ? DEN_ENCOUNTERS : ENCOUNTERS,
    zone === "den" ? state.den : state,
    game.route,
  );
  combatArea = zone;
  game.setCombat(combat);
  refreshEnemyLabels();
}
function enterMoor(fromDen = false) {
  installArea("moor");
  pending = null;
  dialog.close();
  game.setZone("moor");
  if (fromDen) {
    hero.position.set(DEN_GATE.x, 0, DEN_GATE.z + 2);
    companions.forEach((c, i) =>
      c.position.set(DEN_GATE.x - (i % 3), 0, DEN_GATE.z + 3),
    );
    game.updateCamera(1);
  }
  game.hold = false;
  combat.cancel();
  document.querySelector(".place h1").textContent = "Blood Moor";
  document.querySelector(".safe").textContent = "HOSTILE TERRITORY";
  document.querySelector(".safe").classList.add("hostile");
  document.querySelector(".map-caption").textContent = "BLOOD MOOR";
  document.querySelector("#return-camp").hidden = false;
  document.querySelector(".controls").innerHTML =
    'AUTO ATTACK NEARBY FOES <span>·</span> <span class="desktop-hint">RIGHT CLICK / </span>1 CLEAVE <span>·</span> 2 GUARD <span>·</span> 4 POTION';
  update();
  toast("Stay together. Enemy attacks are telegraphed—move to dodge.");
}
function enterDen() {
  pending = null;
  dialog.close();
  installArea("den");
  state.den.entered = true;
  game.setZone("den");
  game.hold = false;
  combat.cancel();
  document.querySelector(".place h1").textContent = "Den of Evil";
  document.querySelector(".safe").textContent = "BENEATH THE MOOR";
  document.querySelector(".safe").classList.add("hostile");
  document.querySelector(".map-caption").textContent = "DEN OF EVIL";
  document.querySelector(".controls").innerHTML =
    "AUTO ATTACK NEARBY FOES <span>·</span> 1 CLEAVE <span>·</span> 2 GUARD <span>·</span> 4 POTION";
  document.querySelector("#return-camp").hidden = false;
  update();
  toast("Clear all three chambers. The Gravewarden waits in the depths.");
}
function returnToCamp() {
  pending = null;
  game.returnHome();
  combat.restore();
  document.querySelector(".place h1").textContent = "Rogue Encampment";
  document.querySelector(".safe").textContent = "SANCTUARY";
  document.querySelector(".safe").classList.remove("hostile");
  document.querySelector(".map-caption").textContent = "ROGUE ENCAMPMENT";
  document.querySelector("#return-camp").hidden = true;
  document.querySelector('[data-action="hold"]').classList.remove("active");
  document.querySelector(".controls").innerHTML =
    "CLICK TO MOVE <span>·</span> WASD <span>·</span> E INTERACT <span>·</span> SPACE REGROUP";
  update();
}
function beginNewExpedition() {
  if (game.zone !== "camp" || !newExpedition(state)) return false;
  combat = createCombat(state, combatEvent, game.blocked, game.route);
  combatArea = "moor";
  game.setCombat(combat);
  refreshEnemyLabels();
  update();
  return true;
}
function expeditionModal() {
  const clear = huntComplete(state.defeated),
    allLoot = huntComplete(state.lootTaken);
  const actions = [{ label: "Enter the Blood Moor", run: () => enterMoor() }];
  if (clear)
    actions.unshift({
      label: allLoot
        ? "Start fresh hunt"
        : "Collect remaining drops before a fresh hunt",
      disabled: !allLoot,
      run: () => {
        if (beginNewExpedition()) enterMoor();
      },
    });
  actions.push({ label: "Stay in camp", run: () => dialog.close() });
  modal(
    "Beyond the palisade",
    `<p>Hunt ${state.run + 1} · ${huntCount(state.defeated)}/12 enemies defeated. Clear the twelve foes on the old road to finish the hunt. Ten outer regions hold sixty additional foes and more loot. Collect the road drops before refreshing; a fresh hunt resets the entire Moor, including uncollected outer spoils.</p><p>The Den of Evil lies beyond the northeastern ruins (recommended level 3). Earn levels 1–${LEVEL_CAP}, try talents in camp [K], and equip new items [I]. Your three companions share your level.</p><p class="muted">Cleave [1] · Guard [2] · Rally [3] · Potion [4] · Retreat [6]. Later hunts are slightly stronger, capped at hunt 4.</p>`,
    actions,
    "Blood Moor · Repeatable first area",
  );
}

refreshEnemyLabels();
document.querySelector("#return-camp").onclick = () => {
  returnToCamp();
  toast("The company returns to camp and recovers.");
};
const roster = COMPANIONS;
function update() {
  game.setEquipment(state.equipment, state.companionEquipment);
  document.querySelector("#potions").textContent = state.potions;
  document.querySelector("#party").innerHTML =
    `<button class="party-card" data-name="hero"><div class="portrait" data-level="${levelOf(state)}">${portrait("hero")}</div><div><div class="member-name">The Wanderer</div><div class="health-line"><i style="width:100%"></i></div><div class="member-role">WARRIOR · YOU</div></div></button>` +
    Object.entries(roster)
      .filter(([name]) => state.roster.includes(name))
      .map(
        ([name, r]) =>
          `<button class="party-card" data-name="${name}" style="opacity:${state.roster.includes(name) ? 1 : 0.4}"><div class="portrait" data-level="${levelOf(state)}">${portrait(name)}</div><div><div class="member-name">${name}</div><div class="health-line"><i style="width:${state.roster.includes(name) ? 100 : 0}%"></i></div><div class="member-role">${state.roster.includes(name) ? r.role.toUpperCase() : "IN RESERVE"}</div></div></button>`,
      )
      .join("");
  document
    .querySelectorAll(".party-card")
    .forEach(
      (b) =>
        (b.onclick = () =>
          b.dataset.name === "hero"
            ? showCharacter()
            : showInventory(b.dataset.name)),
    );
  companions.forEach(
    (c, i) => (c.visible = state.roster.includes(Object.keys(roster)[i])),
  );
  const inMoor = game.zone === "moor";
  const complete = huntComplete(state.defeated);
  const denClear = state.den.defeated.length === DEN_ENCOUNTERS.length;
  const denQuest =
    game.zone === "den" || (denClear && !state.den.rewardClaimed);
  document.querySelector("#quest-title").textContent = denQuest
    ? denClear
      ? "The Den is cleansed"
      : "Den of Evil"
    : inMoor
      ? `Blood Moor · Hunt ${state.run + 1}`
      : complete && !state.rewardClaimed
        ? "Return to Akara"
        : state.rewardClaimed
          ? "Ready for another hunt?"
          : state.quest
            ? "Prepare for the wilderness"
            : "A light in the darkness";
  document.querySelector("#quest-text").innerHTML = denQuest
    ? `${state.den.defeated.length} / ${DEN_ENCOUNTERS.length} creatures defeated.<br>${denClear ? (state.den.rewardClaimed ? "Bounty claimed. Gather any remaining spoils." : "Return to Akara for your reward.") : "Clear every chamber and defeat the Gravewarden."}`
    : inMoor
      ? `${huntCount(state.defeated)} / 12 enemies defeated.<br>${complete ? "Road cleared. Explore the outer regions or return to camp." : "Explore the old road and ten outer regions."}`
      : complete && !state.rewardClaimed
        ? "Speak to Akara for your reward."
        : state.rewardClaimed
          ? "Start a fresh hunt at the eastern gate.<br>Train talents [K] and equip loot [I]."
          : state.quest
            ? `${state.visited.length}/3 camp services visited.<br>Enter the eastern gate when ready.`
            : "Speak to Akara.<br>Find your footing in camp.";
  document
    .querySelector("#skills-menu")
    .classList.toggle("points-ready", skillPoints(state) > 0);
  save();
}
function visited(id) {
  if (!state.visited.includes(id)) {
    state.visited.push(id);
    update();
  }
}
function showCharacter() {
  const stats = heroStats(state),
    xp = xpProgress(state);
  modal(
    "The Wanderer",
    `<p>Warrior · Level ${stats.level} / ${LEVEL_CAP}</p><div class="item-row"><span>Life / Mana</span><strong>${stats.life} / ${stats.mana}</strong></div><div class="item-row"><span>Attack damage</span><strong>${stats.damage}</strong></div><div class="item-row"><span>Equipment protection</span><strong>${stats.armor}%</strong></div><div class="item-row"><span>Mana regeneration</span><strong>${stats.regen} / second</strong></div><div class="item-row"><span>Next level</span><strong>${xp.needed ? `${xp.current} / ${xp.needed} XP` : "Playtest level cap reached"}</strong></div><p>Unspent talent points: ${skillPoints(state)}. Your companions share your level and gain life and damage.</p>`,
    [
      { label: "Open skill trees", run: showSkills },
      { label: "Manage equipment", run: showInventory },
    ],
  );
}
let selectedTalent = "mastery";
function showSkills() {
  const camp = game.zone === "camp";
  modal(
    "Warrior skill trees",
    `<div class="skill-summary"><span>Level ${levelOf(state)} / ${LEVEL_CAP}</span><strong>${skillPoints(state)} unspent point${skillPoints(state) === 1 ? "" : "s"}</strong><span>Two points per level</span></div>${skillTreeMarkup(state, camp, selectedTalent)}`,
    [
      {
        label: "Reset talents · Free in camp",
        disabled: !camp || !Object.keys(state.skills).length,
        run: () => {
          respec(state);
          combat.refreshStats(true);
          update();
          showSkills();
        },
      },
    ],
    "Three paths · Mix branches or specialize",
  );
  dialog.classList.add("wide", "skills-dialog");
  const select = (key, focus = false) => {
    const scroll = dialog.scrollTop;
    selectedTalent = key;
    showSkills();
    if (focus)
      content
        .querySelector(`[data-inspect-talent="${key}"]`)
        .focus({ preventScroll: true });
    dialog.scrollTop = scroll;
  };
  content.querySelectorAll("[data-inspect-talent]").forEach((button) => {
    button.onclick = () => select(button.dataset.inspectTalent, true);
    button.onkeydown = (event) => {
      const keys = Object.keys(TALENTS),
        index = keys.indexOf(button.dataset.inspectTalent);
      const compact = window.matchMedia("(max-width: 700px)").matches;
      const offset = {
        ArrowDown: compact ? 3 : 1,
        ArrowUp: compact ? -3 : -1,
        ArrowRight: compact ? 1 : 3,
        ArrowLeft: compact ? -1 : -3,
      }[event.key];
      if (!offset) return;
      const next = index + offset;
      if (
        next < 0 ||
        next >= keys.length ||
        (Math.abs(offset) === 1 &&
          Math.floor(next / 3) !== Math.floor(index / 3))
      )
        return;
      event.preventDefault();
      select(keys[next], true);
    };
  });
  content.querySelectorAll("[data-skill-branch]").forEach((button) => {
    button.onclick = () => {
      const branch = button.dataset.skillBranch;
      select(
        Object.keys(TALENTS).find((key) => TALENTS[key].branch === branch),
      );
      content
        .querySelector(`[data-skill-branch="${branch}"]`)
        .focus({ preventScroll: true });
    };
  });
  content
    .querySelectorAll("[data-talent], [data-train-selected]")
    .forEach((button) => {
      button.onclick = () => {
        const key = button.dataset.talent || button.dataset.trainSelected;
        if (game.zone === "camp" && trainTalent(state, key)) {
          combat.refreshStats(true);
          update();
          select(key, true);
        }
      };
    });
}
function itemCard(item, equipped = false) {
  const def = ITEMS[item.itemId],
    current = ITEMS[state.equipment[def.slot]?.itemId];
  const diff = current
    ? ["damage", "life", "mana", "armor"]
        .filter((k) => (def[k] || 0) !== (current[k] || 0))
        .map((k) => {
          const d = (def[k] || 0) - (current[k] || 0);
          return `<span class="${d > 0 ? "stat-up" : "stat-down"}">${d > 0 ? "+" : ""}${d}${k === "armor" ? "%" : ""} ${k}</span>`;
        })
        .join(" · ")
    : "";
  return `<article class="item-card ${def.rarity}">${itemIcon(item.itemId, def.slot)}<div class="item-heading"><strong>${def.name}</strong><small>${def.rarity} · ${def.slot} · Lv ${def.level}</small></div><p>${itemStats(def)}</p>${!equipped && diff ? `<div class="item-compare">vs equipped: ${diff}</div>` : ""}${equipped ? '<span class="equipped-tag">Equipped</span>' : `<div class="item-actions"><button data-equip="${item.uid}" ${game.zone !== "camp" || def.level > levelOf(state) ? "disabled" : ""}>${def.level > levelOf(state) ? `Requires level ${def.level}` : "Equip"}</button><button data-sell="${item.uid}" ${game.zone !== "camp" ? "disabled" : ""}>Sell · ${def.value} gold</button></div>`}</article>`;
}
let selectedItem;
let inventoryOwner = "hero";
let inventoryFilter = "all",
  inventorySort = "newest";
const bagFilters = {
  all: "All",
  weapon: "Weapons",
  armor: "Armor",
  trinkets: "Trinkets",
};
const matchesBagFilter = (item, filter) =>
  filter === "all" ||
  (filter === "trinkets"
    ? ["ring", "charm"].includes(ITEMS[item.itemId].slot)
    : ITEMS[item.itemId].slot === filter);
let inspectModel = false;
let previewMotion = "idle";
const weaponArtwork = {
  worn_sword: 0,
  tempered_sword: 1,
  iron_axe: 2,
  hunters_blade: 3,
  frost_edge: 4,
  ember_cleaver: 5,
  dawnsteel: 6,
};
function showInventory(owner = inventoryOwner) {
  if (
    typeof owner === "string" &&
    (owner === "hero" || Object.hasOwn(COMPANIONS, owner))
  )
    inventoryOwner = owner;
  const merc = inventoryOwner !== "hero",
    ownerName = merc ? inventoryOwner : "The Wanderer";
  const equipment = merc
    ? state.companionEquipment[inventoryOwner]
    : state.equipment;
  const displayModel = merc || inspectModel;
  const stats = merc ? companionStats(state, inventoryOwner) : heroStats(state);
  const bag = state.inventory
    .filter((item) => matchesBagFilter(item, inventoryFilter))
    .reverse();
  if (inventorySort !== "newest")
    bag.sort(
      (a, b) => ITEMS[b.itemId][inventorySort] - ITEMS[a.itemId][inventorySort],
    );
  const selected =
    selectedItem === "equipped"
      ? null
      : bag.find((i) => i.uid === selectedItem) ||
        bag.find(
          (i) =>
            ITEMS[i.itemId].level <= levelOf(state) &&
            canEquipItem(inventoryOwner, ITEMS[i.itemId]),
        ) ||
        bag[0];
  if (selectedItem !== "equipped") selectedItem = selected?.uid;
  const def = selected ? ITEMS[selected.itemId] : null;
  const current = def ? equipment[def.slot] : null;
  const currentDef = current ? ITEMS[current.itemId] : null;
  const compare = def
    ? ["damage", "life", "mana", "armor", "healing"]
        .filter((k) => def[k] || 0 || currentDef?.[k] || 0)
        .map((k) => {
          const delta = (def[k] || 0) - (currentDef?.[k] || 0);
          return `<div class="compare-row"><span>${k === "armor" ? "Protection" : k[0].toUpperCase() + k.slice(1)}</span><span>${currentDef?.[k] || 0}${k === "armor" ? "%" : ""}</span><strong>${def[k] || 0}${k === "armor" ? "%" : ""}</strong><span class="${delta > 0 ? "stat-up" : delta < 0 ? "stat-down" : ""}">${delta > 0 ? "+" : ""}${delta || "—"}</span></div>`;
        })
        .join("")
    : "";
  const compatible = def && canEquipItem(inventoryOwner, def);
  const canEquip =
    game.zone === "camp" && compatible && def.level <= levelOf(state);
  const weapon =
    def?.slot === "weapon" && compatible
      ? selected.itemId
      : equipment.weapon?.itemId;
  const appearance = weaponArtwork[weapon] ?? 0;
  modal(
    "Inventory",
    `
    <div class="inventory-summary"><span>${state.gold} gold <small> · ${state.stash} stashed</small></span><span>${state.inventory.length} / ${BAG_LIMIT} items</span></div>
    <div class="equipment-owner"><label>Equip for <select id="equipment-owner" aria-label="Equip for"><option value="hero" ${!merc ? "selected" : ""}>The Wanderer · Warrior</option>${Object.entries(
      COMPANIONS,
    )
      .map(
        ([id, c]) =>
          `<option value="${id}" ${id === inventoryOwner ? "selected" : ""}>${id} · ${c.role}${state.roster.includes(id) ? "" : " · At camp"}</option>`,
      )
      .join(
        "",
      )}</select></label><p><strong>${stats.life}</strong> life · <strong>${stats.damage}</strong> damage · <strong>${stats.armor}%</strong> protection${inventoryOwner === "Eira" ? ` · <strong>${stats.healing}</strong> healing` : ""}</p></div>
    <div class="equipment-stage"><div class="hero-preview"><div class="hero-illustration" role="img" aria-label="The Wanderer holding ${ITEMS[weapon]?.name || "a weapon"}" style="--hx:${((appearance % 4) * 100) / 3}%;--hy:${Math.floor(appearance / 4) * 100}%" ${displayModel ? "hidden" : ""}></div><canvas id="equipment-preview" aria-label="Directional character preview. Drag to turn." ${displayModel ? "" : "hidden"}></canvas>${merc ? "" : `<button class="preview-toggle" id="preview-toggle">${inspectModel ? "Character portrait" : "Turn character"}</button>`}${
      displayModel
        ? `<div class="preview-motion" role="group" aria-label="Character motion">${[
            ["idle", "Stand"],
            ["walk", "Walk"],
            ["attack", "Attack"],
          ]
            .map(
              ([mode, label]) =>
                `<button data-preview-motion="${mode}" aria-pressed="${previewMotion === mode}">${label}</button>`,
            )
            .join("")}</div>`
        : ""
    }<span class="preview-caption">${def?.slot === "weapon" && compatible ? `Preview: ${def.name}` : ownerName + " · Level " + levelOf(state)}</span></div><div class="equipped-slots">${Object.entries(
      equipment,
    )
      .map(
        ([slot, item]) =>
          `<div class="equipped-slot"><span class="slot-name">${slot}</span>${item ? `${itemIcon(item.itemId, slot)}<strong>${ITEMS[item.itemId].name}</strong>${merc ? `<button data-unequip="${slot}" aria-label="Unequip ${ITEMS[item.itemId].name} from ${ownerName}" ${game.zone !== "camp" || state.inventory.length >= BAG_LIMIT ? "disabled" : ""}>Remove</button>` : ""}` : `<span class="empty-slot">${merc && slot === "weapon" ? "Issued " + { Ilyra: "longbow", Bram: "mace", Eira: "sun staff", Soren: "frost staff", Aldric: "longsword", Nyx: "daggers" }[inventoryOwner] : "Empty"}</span>`}</div>`,
      )
      .join("")}</div></div>
    ${selected ? `<section class="item-detail ${def.rarity}"><div class="compare-head"><div><small>${ownerName} · Equipped</small><strong>${currentDef?.name || "Empty slot"}</strong></div><div><small>Selected · ${def.rarity}</small><strong>${def.name}</strong></div></div>${compare}<p class="requirement">${canEquip ? "Ready to equip" : game.zone !== "camp" ? "Return to camp to change equipment" : !compatible ? `${ownerName} cannot use this weapon` : `Requires level ${def.level}`}</p><div class="item-actions"><button class="primary" data-equip="${selected.uid}" ${canEquip ? "" : "disabled"}>Equip ${def.slot}${merc ? " on " + ownerName : ""}</button><button data-sell="${selected.uid}" ${game.zone === "camp" ? "" : "disabled"}>Sell · ${def.value} gold</button></div></section>` : `<p class="empty-bag">${state.inventory.length ? (selectedItem === "equipped" ? "Equipment updated. Select another item below to compare." : "Choose another category to compare your equipment.") : "Your backpack is empty. Find equipment in the Blood Moor or visit Charsi at the forge."}</p>`}
    <div class="bag-heading"><h3>Backpack</h3><span>${state.potions} healing potions · [4]</span></div>
    <div class="bag-tools"><div class="bag-filters" role="group" aria-label="Filter backpack">${Object.entries(
      bagFilters,
    )
      .map(
        ([key, label]) =>
          `<button data-bag-filter="${key}" aria-pressed="${inventoryFilter === key}" aria-label="${key === "all" ? "Show all items" : "Show " + label.toLowerCase()}">${label} <small>${state.inventory.filter((item) => matchesBagFilter(item, key)).length}</small></button>`,
      )
      .join(
        "",
      )}</div><label class="bag-sort">Sort <select aria-label="Sort backpack" id="bag-sort">${[
      ["newest", "Newest"],
      ["level", "Highest level"],
      ["value", "Highest value"],
    ]
      .map(
        ([key, label]) =>
          `<option value="${key}" ${inventorySort === key ? "selected" : ""}>${label}</option>`,
      )
      .join("")}</select></label></div>
    <div class="inventory-bag" role="group" aria-label="Backpack">${bag
      .map((i) => {
        const d = ITEMS[i.itemId];
        return `<button class="bag-item ${d.rarity} ${i.uid === selectedItem ? "selected" : ""}" data-select-item="${i.uid}" aria-label="${d.name}, ${d.rarity}, level ${d.level}" aria-pressed="${i.uid === selectedItem}" title="${d.name} · ${itemStats(d)}">${itemIcon(i.itemId, d.slot)}<small class="bag-level">Lv${d.level}</small><span>${d.name}</span></button>`;
      })
      .join(
        "",
      )}${!bag.length ? `<p class="bag-empty">${state.inventory.length ? "No items in this category. Choose another filter." : "Your next find belongs here."}</p>` : ""}</div>
    <p class="inventory-help">Select an item to compare. Equip and sell in camp. Progress saves automatically.</p>`,
    [],
    ownerName + " · Equipment",
  );
  dialog.classList.add("inventory-dialog");
  if (displayModel)
    preview = createCharacterPreview(
      document.querySelector("#equipment-preview"),
      inventoryOwner,
      weapon,
    );
  if (preview) preview.setMotion(previewMotion);
  content.querySelectorAll("[data-preview-motion]").forEach((button) => {
    button.onclick = () => {
      previewMotion = button.dataset.previewMotion;
      preview?.setMotion(previewMotion);
      content
        .querySelectorAll("[data-preview-motion]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    };
  });
  document.querySelector("#equipment-owner").onchange = (event) => {
    selectedItem = null;
    showInventory(event.target.value);
    dialog.scrollTop = 0;
    document.querySelector("#equipment-owner").focus();
  };
  content.querySelectorAll("[data-unequip]").forEach(
    (button) =>
      (button.onclick = () => {
        if (
          game.zone === "camp" &&
          unequipItem(state, button.dataset.unequip, inventoryOwner)
        ) {
          combat.refreshStats(true);
          selectedItem = "equipped";
          update();
          showInventory();
          toast(`${ownerName} returned equipment to the backpack`);
        }
      }),
  );
  if (document.querySelector("#preview-toggle"))
    document.querySelector("#preview-toggle").onclick = () => {
      inspectModel = !inspectModel;
      showInventory();
    };
  const refreshBag = (selector) => {
    const scroll = dialog.scrollTop;
    showInventory();
    content.querySelector(selector)?.focus({ preventScroll: true });
    dialog.scrollTop = scroll;
  };
  content.querySelectorAll("[data-bag-filter]").forEach((button) => {
    button.onclick = () => {
      inventoryFilter = button.dataset.bagFilter;
      selectedItem = null;
      refreshBag(`[data-bag-filter="${inventoryFilter}"]`);
    };
  });
  content.querySelector("#bag-sort").onchange = (event) => {
    inventorySort = event.target.value;
    refreshBag("#bag-sort");
  };
  content.querySelectorAll("[data-select-item]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedItem = b.dataset.selectItem;
        showInventory();
      }),
  );
  content.querySelector("[data-equip]")?.addEventListener("click", () => {
    if (
      game.zone === "camp" &&
      equipItem(state, selected.uid, inventoryOwner)
    ) {
      combat.refreshStats(true);
      selectedItem = "equipped";
      update();
      showInventory();
      dialog.scrollTop = 0;
      toast(`${def.name} equipped${merc ? " on " + ownerName : ""}`);
    }
  });
  content.querySelector("[data-sell]")?.addEventListener("click", () => {
    if (game.zone === "camp" && sellItem(state, selected.uid)) {
      selectedItem = null;
      update();
      showInventory();
      toast(`${def.name} sold for ${def.value} gold`);
    }
  });
}
function showShop() {
  modal(
    "Charsi’s stock",
    `<p>◈ ${state.gold} gold · Purchased items go to your backpack [I]. Level requirements apply when equipping.</p><div class="bag-grid">${VENDOR_STOCK.map(
      (id) => {
        const d = ITEMS[id];
        return `<article class="item-card ${d.rarity}">${itemIcon(id, d.slot)}<strong>${d.name}</strong><small>${d.slot} · Level ${d.level}</small><p>${itemStats(d)}</p><button class="action" data-buy="${id}" ${state.gold < d.value * 3 || state.inventory.length >= BAG_LIMIT ? "disabled" : ""}>Buy ${d.name} · ${d.value * 3} gold</button></article>`;
      },
    ).join("")}</div>`,
    [],
    "Blacksmith · Equipment",
  );
  dialog.classList.add("wide");
  content.querySelectorAll("[data-buy]").forEach(
    (b) =>
      (b.onclick = () => {
        if (game.zone === "camp" && buyItem(state, b.dataset.buy)) {
          update();
          showShop();
        }
      }),
  );
}
function showJournal() {
  if (state.den.entered) {
    const clear = state.den.defeated.length === DEN_ENCOUNTERS.length;
    modal(
      "Den of Evil",
      `<p>Cleanse the three chambers beneath the Blood Moor. Defeat every creature, including the Gravewarden, then return to Akara.</p><div class="item-row"><span>Creatures defeated</span><span>${state.den.defeated.length} / ${DEN_ENCOUNTERS.length}</span></div><div class="item-row"><span>Reward</span><span>175 gold · 3 potions</span></div><p>${state.den.rewardClaimed ? "Bounty claimed. The Den remains clear; uncollected loot stays in the dungeon." : clear ? "The Den is cleansed. Speak to Akara in camp." : "Enter through the northeastern cleft in the Blood Moor. Recommended level 3. Retreating preserves defeated enemies and uncollected loot."}</p><h3>The old road</h3><p>Blood Moor: ${huntCount(state.defeated)} / 12 road foes · ${state.defeated.length} / ${ENCOUNTERS.length} total foes defeated · ${state.rewardClaimed ? "First bounty claimed" : "100 gold and 2 potions from Akara after clearing"}.</p>`,
      [],
      "Act I · Beneath the Moor",
    );
    return;
  }
  if (game.zone !== "camp" || state.defeated.length) {
    modal(
      "The old road",
      `<p>Clear the Blood Moor and return to Akara. Your company must defeat the Ashen Brute and the creatures haunting the road.</p><div class="item-row"><span>Enemies defeated</span><span>${huntCount(state.defeated)} / 12 road foes</span></div><div class="item-row"><span>Reward</span><span>100 gold · 2 potions</span></div><p>${state.rewardClaimed ? "First bounty claimed. Collect the old-road drops, then start another hunt at the eastern gate to keep leveling and finding gear." : huntComplete(state.defeated) ? "Return to Akara to claim your reward." : "Use the eastern gate in camp to begin. Progress is preserved when you retreat."}</p>`,
      [],
      "Act I · First expedition",
    );
    return;
  }
  modal(
    "A light in the darkness",
    state.quest
      ? `<p>Akara has asked you to prepare your company before venturing beyond the palisade.</p>${["Charsi", "Kashya", "Stash"].map((n) => `<div class="item-row"><span>${n}</span><span>${state.visited.includes(n) ? "✓ Visited" : "Not yet visited"}</span></div>`).join("")}<p>${state.visited.length === 3 ? "Your company is ready. Enter the eastern gate to explore the Blood Moor." : "Visit the blacksmith, recruitment post, and shared stash."}</p>`
      : "<p>The encampment is the last safe haven on the western road. Find Akara near the violet tent and learn what troubles these lands.</p>",
    [],
    "Act I · Camp preparations",
  );
}
function showParty() {
  const camp = game.zone === "camp";
  modal(
    "Your company",
    `<p>${state.roster.length}/3 companion slots filled · Shared level ${levelOf(state)}. ${camp ? "Dismiss a companion to make room for another. Recruitment is free for the playtest." : "Return to Kashya in camp to change the party."}</p><div class="companion-grid">${Object.entries(
      roster,
    )
      .map(([name, r]) => {
        const active = state.roster.includes(name);
        return `<article class="companion-card ${active ? "in-party" : ""}"><div class="companion-title">${portrait(name, "company-portrait")}<div><h3>${name}</h3><small>${r.role} · ${active ? "In your party" : "At camp"}</small></div></div><p>${r.description}</p><div class="muted">${r.special} · ${companionStats(state, name).life} life · ${companionStats(state, name).damage} damage</div><button data-gear="${name}" aria-label="Equipment for ${name}">Equipment</button><button class="action" data-companion="${name}" ${!camp || (!active && state.roster.length >= 3) ? "disabled" : ""}>${active ? "Dismiss" : "Recruit"} ${name} · ${r.role}</button>${!active && state.roster.length === 3 && camp ? `<div class="swap-row"><select aria-label="Companion to replace with ${name}" data-swap-choice="${name}">${state.roster.map((id) => `<option value="${id}">Replace ${id}</option>`).join("")}</select><button data-swap="${name}">Swap</button></div>` : ""}</article>`;
      })
      .join("")}</div>`,
    [],
    "Kashya · Six specialists",
  );
  dialog.classList.add("wide", "company-dialog");
  content
    .querySelectorAll("[data-gear]")
    .forEach(
      (button) => (button.onclick = () => showInventory(button.dataset.gear)),
    );
  content.querySelectorAll("[data-swap]").forEach(
    (b) =>
      (b.onclick = () => {
        if (game.zone !== "camp") return;
        const replacement = b.dataset.swap,
          old = content.querySelector(
            `[data-swap-choice="${replacement}"]`,
          ).value;
        if (!state.roster.includes(old) || state.roster.includes(replacement))
          return;
        state.roster[state.roster.indexOf(old)] = replacement;
        companions[Object.keys(roster).indexOf(replacement)].position
          .copy(hero.position)
          .add(new THREE.Vector3(1, 0, 1));
        combat.refreshStats(true);
        update();
        showParty();
        toast(`${replacement} replaced ${old}`);
      }),
  );
  content.querySelectorAll("[data-companion]").forEach(
    (b) =>
      (b.onclick = () => {
        if (game.zone !== "camp") return;
        const name = b.dataset.companion;
        if (state.roster.includes(name)) dismiss(state, name);
        else if (recruit(state, name))
          companions[Object.keys(roster).indexOf(name)].position
            .copy(hero.position)
            .add(new THREE.Vector3(1, 0, 1));
        combat.refreshStats(true);
        update();
        showParty();
      }),
  );
}
function interact(id) {
  if (game.zone !== "camp") return;
  if (id === "Akara") {
    if (
      state.den.defeated.length === DEN_ENCOUNTERS.length &&
      !state.den.rewardClaimed
    ) {
      modal(
        "A light beneath the earth",
        "<p>“The silence beneath the moor is a mercy we had almost forgotten. Your company has earned these supplies.”</p>",
        [
          {
            label: "Claim Den reward · 175 gold + 3 potions",
            run: () => {
              if (claimDenReward(state)) {
                update();
                toast("The Den of Evil is cleansed. Bounty claimed.");
              }
              dialog.close();
            },
          },
        ],
        "Akara · Den of Evil complete",
      );
      return;
    }
    if (huntComplete(state.defeated) && !state.rewardClaimed) {
      modal(
        "The road is clear",
        "<p>“You have given us a little breathing room, traveler. Take these supplies. There will be darker paths ahead.”</p>",
        [
          {
            label: "Claim reward · 100 gold + 2 potions",
            run: () => {
              if (claimReward(state)) {
                update();
                toast("Expedition complete. Reward added to your inventory.");
              }
              dialog.close();
            },
          },
        ],
        "Akara · Expedition complete",
      );
      return;
    }
    modal(
      "Akara",
      `<p>“There is a darkness beyond these walls, traveler. But here, for a moment, you may rest. Gather your company. We will need every willing blade.”</p><p class="muted">Healer · Potions · Camp preparations</p>`,
      [
        {
          label: state.quest
            ? "Review camp preparations"
            : "Ask about the encampment",
          run: () => {
            state.quest = true;
            update();
            showJournal();
          },
        },
        {
          label: "Rest and restore the party",
          run: () => {
            dialog.close();
            combat.restore();
            game.pulse(0x9bbba0);
            toast("The party is rested. Life and mana restored.");
          },
        },
        {
          label: "Buy healing potion · 20 gold",
          disabled: state.gold < 20,
          run: () => {
            state.gold -= 20;
            state.potions++;
            update();
            interact(id);
            toast("Healing potion added to your inventory.");
          },
        },
      ],
      "The spiritual leader",
    );
  }
  if (id === "Charsi") {
    visited(id);
    modal(
      "Charsi",
      `<p>“A good blade is a promise. Let me make sure yours keeps it.”</p><div class="item-row"><span>Tempered longsword</span><span>15 damage</span></div><p class="gold">◈ ${state.gold} gold</p>`,
      [
        {
          label: state.weapon
            ? state.equipment.weapon?.itemId === "tempered_sword"
              ? "Tempered longsword equipped"
              : "Tempered longsword purchased"
            : "Buy & equip longsword · 100 gold",
          disabled:
            state.weapon ||
            state.gold < 100 ||
            state.inventory.length >= BAG_LIMIT,
          run: () => {
            state.gold -= 100;
            state.weapon = true;
            if (state.inventory.length < BAG_LIMIT)
              state.inventory.push(state.equipment.weapon);
            state.equipment.weapon = {
              uid: "vendor-tempered",
              itemId: "tempered_sword",
            };
            combat.refreshStats(true);
            update();
            interact(id);
            toast("Tempered longsword equipped.");
          },
        },
        { label: "Browse equipment stock", run: showShop },
        { label: "Sell or equip items", run: showInventory },
      ],
      "Blacksmith",
    );
  }
  if (id === "Kashya") {
    visited(id);
    showParty();
  }
  if (id === "Stash") {
    visited(id);
    modal(
      "Shared stash",
      `<p>Your company’s supplies, kept safe within the palisade.</p><div class="item-row"><span>Carried gold</span><span>${state.gold}</span></div><div class="item-row"><span>Stored gold</span><span>${state.stash}</span></div>`,
      [
        {
          label: "Deposit 50 gold",
          disabled: state.gold < 50,
          run: () => {
            state.gold -= 50;
            state.stash += 50;
            update();
            interact(id);
          },
        },
        {
          label: "Withdraw 50 gold",
          disabled: state.stash < 50,
          run: () => {
            state.gold += 50;
            state.stash -= 50;
            update();
            interact(id);
          },
        },
      ],
    );
  }
  if (id === "Waypoint")
    modal(
      "Ancient waypoint",
      "<p>The stones hum beneath your feet. This camp is the only discovered destination.</p>",
      [
        {
          label: "Rogue Encampment · Current location",
          run: () => {
            dialog.close();
            returnToCamp();
            toast("Returned to the campfire.");
          },
        },
      ],
    );
  if (id === "Blood Moor") expeditionModal();
}
let pending = null;
game.onManualMove = () => {
  pending = null;
  if (game.practiceWindup) {
    game.practiceWindup = 0;
    hero.userData.swing = 0;
  }
};
for (const npc of npcs) {
  const el = document.createElement("button");
  el.className = "npc-label";
  el.innerHTML = `${npc.name === "Akara" ? '<span class="marker">!</span>' : ""}${npc.name}<small>${npc.role}</small>`;
  el.onclick = () => {
    if (hero.position.distanceTo(npc.point) < 4) interact(npc.name);
    else {
      pending = npc;
      game.moveTo(npc.point);
      toast(`Approaching ${npc.name}…`);
    }
  };
  document.querySelector("#labels").append(el);
  npc.label = el;
}
const areaPassage = document.createElement("button");
areaPassage.className = "npc-label area-passage";
document.querySelector("#labels").append(areaPassage);
function useAreaPassage() {
  const entering = game.zone === "moor";
  const location = entering ? DEN_GATE : DEN_EXIT;
  const point = new THREE.Vector3(location.x, 0, location.z);
  const enter = entering ? enterDen : () => enterMoor(true);
  if (hero.position.distanceTo(point) < 2.5) {
    enter();
    return;
  }
  combat.cancel();
  pending = { point, enter };
  game.moveTo(point);
}
areaPassage.onclick = useAreaPassage;
function action(name, targetId) {
  if (name === "rally") {
    game.hold = false;
    game.regroup();
    combat.rally();
    toast(
      state.skills.battleCry
        ? "Your company regroups. Battle Cry heals when ready."
        : "Your company gathers around you.",
    );
  }
  if (name === "hold") {
    game.hold = !game.hold;
    toast(
      game.hold ? "Companions hold their ground." : "Companions are following.",
    );
    document
      .querySelector('[data-action="hold"]')
      .classList.toggle("active", game.hold);
  }
  if (name === "portal") {
    returnToCamp();
    toast("Returned to the campfire.");
  }
  if (name === "attack") {
    if (game.zone !== "camp") {
      if (!combat.cleave(targetId))
        toast("Cleave needs a nearby enemy and 8 mana.");
      return;
    }
    game.swing();
    toast("Practice swing · The camp is a sanctuary.");
  }
  if (name === "guard") {
    if (game.zone !== "camp") {
      if (combat.defend()) {
        toast(
          `Guard raised · damage reduced for ${3 + (state.skills.bulwark || 0)} seconds.`,
        );
      } else toast("Guard needs 10 mana and an 8-second cooldown.");
      return;
    }
    game.combatVisual({ type: "guard", id: "hero", duration: 3 });
    toast("Guard stance · Ready for what lies beyond.");
  }
  if (name === "heal") {
    if (game.zone !== "camp" && combat.heal()) {
      update();
      toast("Healing potion used · restored up to 65 life.");
      return;
    }
    if (state.potions === 0)
      return toast("No healing potions. Visit Akara to buy more.");
    toast("Life is already full. Potion preserved.");
  }
}
game.onSecondaryAttack = (targetId) => {
  if (dialog.open) return;
  pending = null;
  action("attack", targetId);
};
document
  .querySelectorAll("[data-action]")
  .forEach((b) => (b.onclick = () => action(b.dataset.action)));
document.querySelector("#character").onclick = showCharacter;
document.querySelector("#inventory").onclick = showInventory;
document.querySelector("#journal").onclick = showJournal;
document.querySelector("#journal-link").onclick = showJournal;
document.querySelector("#party-menu").onclick = showParty;
document.querySelector("#skills-menu").onclick = showSkills;
const help = () =>
  modal(
    "The road begins here",
    '<p>Explore the camp and meet its inhabitants. Click a name to approach and talk.</p><div class="item-row"><span>Move</span><span>Click ground / WASD</span></div><div class="item-row"><span>Interact nearby</span><span>E</span></div><div class="item-row"><span>Regroup companions</span><span>Space / 3</span></div><div class="item-row"><span>Hold / follow</span><span>5</span></div><div class="item-row"><span>Zoom</span><span>Mouse wheel</span></div><div class="item-row"><span>Inventory / journal / party</span><span>I / J / P</span></div><p class="muted">Progress is saved locally on this browser. Enter the eastern gate to fight in the Blood Moor. The hero attacks nearby foes automatically when stationary. Click an enemy to approach and focus it; right-click an enemy to approach and Cleave, or press 1 to Cleave nearby. Press 2 to guard and 4 to heal. Press 6 to retreat. K opens skill trees. Train and respec in camp. Click a mercenary portrait or choose Equip for in Inventory to manage their gear. Each cleared hunt can be refreshed at the eastern gate after collecting all drops.</p>',
  );
document.querySelector("#help").onclick = help;
document.querySelector("#settings").onclick = () =>
  modal(
    "Camp settings",
    "<p>Rendering resolution adjusts to your device while UI text stays sharp.</p>",
    [
      {
        label: game.low ? "Enable detailed shadows" : "Use performance mode",
        run: () => {
          game.low = !game.low;
          renderer.shadowMap.enabled = !game.low;
          renderer.shadowMap.needsUpdate = true;
          game.resetRenderBudget();
          dialog.close();
          toast(
            game.low
              ? "Performance mode enabled."
              : "Detailed shadows enabled.",
          );
        },
      },
      {
        label: game.reducedEffects
          ? "Use full combat effects"
          : "Reduce combat effects",
        run: () => {
          game.reducedEffects = !game.reducedEffects;
          dialog.close();
          toast(
            game.reducedEffects
              ? "Combat effects softened."
              : "Full combat effects enabled.",
          );
        },
      },
      {
        label: "Reset camp progress…",
        run: () =>
          modal(
            "Begin again?",
            "<p>This removes your locally saved purchases, recruitment choices, and camp quest progress.</p>",
            [
              {
                label: "Reset this playtest",
                run: () => {
                  state = freshState();
                  combat = createCombat(
                    state,
                    combatEvent,
                    game.blocked,
                    game.route,
                  );
                  game.setCombat(combat);
                  refreshEnemyLabels();
                  update();
                  returnToCamp();
                  dialog.close();
                  toast("A new journey begins.");
                },
              },
              { label: "Keep my progress", run: () => dialog.close() },
            ],
          ),
      },
    ],
  );
let audio;
document.querySelector("#sound").onclick = async () => {
  if (!audio) {
    const ctx = new AudioContext();
    let buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate),
      d = buffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.22;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    audio = ctx;
    combatSound = createCombatAudio(ctx);
    toast("Wind and combat sounds enabled.");
  } else {
    if (audio.state === "running") {
      await audio.suspend();
      toast("Sound muted.");
    } else {
      await audio.resume();
      toast("Wind and combat sounds enabled.");
    }
  }
  document.querySelector("#sound").style.color =
    audio.state === "running" ? "#f3d38f" : "#c9b38c";
};
window.addEventListener("keydown", (e) => {
  if (dialog.open) return;
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  const k = e.key.toLowerCase();
  if (k === "e") {
    if (game.zone !== "camp") {
      const passage = game.zone === "den" ? DEN_EXIT : DEN_GATE;
      if (
        Math.hypot(hero.position.x - passage.x, hero.position.z - passage.z) < 3
      ) {
        useAreaPassage();
        return;
      }
      if (
        game.zone === "moor" &&
        hero.position.distanceTo(new THREE.Vector3(-15, 0, 10)) < 4
      )
        returnToCamp();
      else
        toast(
          "Walk over glowing drops to collect them. Press 6 to return to camp.",
        );
      return;
    }
    const npc = [...npcs].sort(
      (a, b) =>
        a.point.distanceTo(hero.position) - b.point.distanceTo(hero.position),
    )[0];
    if (npc.point.distanceTo(hero.position) < 4) interact(npc.name);
    else toast("Move closer to a towns-person or click their name.");
  }
  if (k === "m") toggleMap();
  if (k === "escape") toggleMap(false);
  if (k === "i") showInventory();
  if (k === "j") showJournal();
  if (k === "c") showCharacter();
  if (k === "p") showParty();
  if (k === "k" || k === "t") showSkills();
  if (e.code === "Space") action("rally");
  if (/^[1-6]$/.test(k))
    action(
      ["attack", "guard", "rally", "heal", "hold", "portal"][Number(k) - 1],
    );
});
const map = document.querySelector("#map"),
  ctx = map.getContext("2d");
const mapScale = () =>
  game.zone === "moor"
    ? Math.min(
        244 / (MOOR_BOUNDS.maxX - MOOR_BOUNDS.minX),
        184 / (MOOR_BOUNDS.maxZ - MOOR_BOUNDS.minZ),
      )
    : 5.3;
const pos = (p) => [137 + p.x * mapScale(), 108 + p.z * mapScale()];
function toggleMap(force) {
  document.querySelector(".minimap").dataset.zone = game.zone;
  const classes = document.querySelector(".minimap").classList;
  const open =
    force === undefined
      ? classes.toggle("map-open")
      : classes.toggle("map-open", force);
  document
    .querySelector("#map-menu")
    .setAttribute("aria-expanded", String(open));
}
document.querySelector("#map-menu").onclick = () => toggleMap();
document.querySelectorAll("[data-map-region]").forEach((button) => {
  button.onclick = () => {
    const r = MOOR_REGIONS.find((r) => r.id === button.dataset.mapRegion);
    game.moveTo(new THREE.Vector3(r.x, 0, r.z));
    combat.cancel();
    toggleMap(false);
  };
});
map.setAttribute(
  "aria-label",
  "Area map. Click to walk to a location. M enlarges the map.",
);
map.onclick = (event) => {
  if (dialog.open) return;
  const r = map.getBoundingClientRect(),
    scale = mapScale();
  const x = (((event.clientX - r.left) / r.width) * 274 - 137) / scale;
  const z = (((event.clientY - r.top) / r.height) * 216 - 108) / scale;
  game.moveTo(new THREE.Vector3(x, 0, z));
  combat.cancel();
  if (document.querySelector(".minimap").classList.contains("map-open"))
    toggleMap(false);
};
function drawMap() {
  ctx.clearRect(0, 0, 274, 216);
  if (game.zone === "den") {
    ctx.fillStyle = "#8f856743";
    for (const r of DEN_ROOMS) {
      const [x, z] = pos(r);
      ctx.fillRect(
        x - (r.w * mapScale()) / 2,
        z - (r.d * mapScale()) / 2,
        r.w * mapScale(),
        r.d * mapScale(),
      );
    }
  }
  if (game.zone !== "camp") {
    const [x, z] = pos(game.zone === "den" ? DEN_EXIT : DEN_GATE);
    ctx.fillStyle = "#97c5de";
    ctx.fillRect(x - 3, z - 3, 6, 6);
  }
  ctx.strokeStyle = "#8f90604d";
  ctx.lineWidth = 1;
  if (game.zone === "moor") {
    const scale = mapScale();
    ctx.strokeRect(
      137 + MOOR_BOUNDS.minX * scale,
      108 + MOOR_BOUNDS.minZ * scale,
      84 * scale,
      68 * scale,
    );
    ctx.fillStyle = "#a89b75";
    for (const region of MOOR_REGIONS) {
      const [x, z] = pos(region);
      ctx.strokeRect(x - 3, z - 3, 6, 6);
      if (document.querySelector(".minimap").classList.contains("map-open")) {
        ctx.font = "bold 10px Georgia";
        ctx.textAlign = "center";
        ctx.fillText(String(MOOR_REGIONS.indexOf(region) + 1), x, z - 6);
      }
    }
  } else ctx.strokeRect(33, 24, 208, 170);
  ctx.fillStyle = "#726d5055";
  for (const o of game.obstacles) {
    let [x, z] = pos(o);
    ctx.fillRect(
      x - (o.w * mapScale()) / 2,
      z - (o.d * mapScale()) / 2,
      o.w * mapScale(),
      o.d * mapScale(),
    );
  }
  ctx.strokeStyle = "#90886b44";
  ctx.beginPath();
  ctx.moveTo(137, 40);
  ctx.lineTo(137, 188);
  ctx.moveTo(65, 108);
  ctx.lineTo(241, 108);
  ctx.stroke();
  for (const n of game.zone === "camp" ? npcs : []) {
    ctx.fillStyle = n.name === "Akara" ? "#d6b575" : "#859983";
    const [x, z] = pos(n.point);
    ctx.fillRect(x - 2, z - 2, 4, 4);
  }
  for (const c of companions.filter((c) => c.visible)) {
    const [x, z] = pos(c.position);
    ctx.fillStyle = "#99b3a1";
    ctx.fillRect(x - 2, z - 2, 4, 4);
  }
  if (game.zone !== "camp")
    for (const enemy of combat.enemies.filter((e) => e.hp > 0)) {
      const [x, z] = pos(enemy);
      ctx.fillStyle = enemy.elite ? "#e0b068" : "#c36554";
      ctx.fillRect(x - 2, z - 2, 4, 4);
    }
  const [x, z] = pos(hero.position);
  ctx.fillStyle = "#ffe2a1";
  ctx.beginPath();
  ctx.moveTo(x, z - 5);
  ctx.lineTo(x - 4, z + 4);
  ctx.lineTo(x + 4, z + 4);
  ctx.closePath();
  ctx.fill();
}
const actionButtons = [...document.querySelectorAll("[data-action]")];
function updateActionFeedback() {
  const fighting = game.zone !== "camp",
    cooldown = combat.cooldowns;
  const tags = {
    attack: !fighting
      ? ""
      : combat.cleaveQueued
        ? "Queued"
        : combat.mana < 8
          ? "8 mana"
          : "",
    guard: !fighting
      ? ""
      : combat.guard > 0
        ? `${combat.guard.toFixed(1)}s`
        : cooldown.guard > 0
          ? `${Math.ceil(cooldown.guard)}s`
          : combat.mana < 10
            ? "10 mana"
            : "",
    rally:
      fighting && state.skills.battleCry && cooldown.rally > 0
        ? `${Math.ceil(cooldown.rally)}s`
        : "",
    heal: !state.potions
      ? "Empty"
      : fighting && combat.allies[0].hp >= combat.allies[0].maxHp
        ? "Full"
        : "",
    hold: game.hold ? "Holding" : "",
    portal: "",
  };
  for (const button of actionButtons) {
    const id = button.dataset.action,
      tag = tags[id];
    const text = button.querySelector(".slot-state");
    if (text.textContent !== tag) text.textContent = tag;
    button.classList.toggle(
      "cooling",
      fighting &&
        ((id === "guard" && cooldown.guard > 0 && !combat.guard) ||
          (id === "attack" && combat.mana < 8)),
    );
    button.classList.toggle(
      "active",
      (id === "guard" && fighting && combat.guard > 0) ||
        (id === "hold" && game.hold) ||
        (id === "attack" && combat.cleaveQueued),
    );
    if (id === "hold" || id === "guard")
      button.setAttribute(
        "aria-pressed",
        String(id === "hold" ? game.hold : fighting && combat.guard > 0),
      );
    const label = button.querySelector(".slot-label").textContent;
    const accessible = `${label} [${button.querySelector("kbd").textContent}]${tag ? ` · ${tag}` : ""}`;
    if (button.getAttribute("aria-label") !== accessible)
      button.setAttribute("aria-label", accessible);
  }
  const status = document.querySelector("#combat-status");
  const parts = [];
  if (fighting && combat.guard > 0)
    parts.push(`Guard active · ${Math.ceil(combat.guard)}s`);
  if (combat.cleaveQueued) parts.push("Cleave queued");
  if (game.hold) parts.push("Company holding");
  status.hidden = !parts.length;
  const summary = parts.join("  /  ");
  if (status.textContent !== summary) status.textContent = summary;
}
const lootLabels = new Map();
let last = performance.now(),
  accumulator = 0,
  simulationTime = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (!document.hidden) game.adaptPerformance(dt);
  accumulator += dialog.open || document.hidden ? 0 : dt;
  while (accumulator >= 1 / 30) {
    simulationTime += 1 / 30;
    game.update(1 / 30, simulationTime, false);
    accumulator -= 1 / 30;
  }
  if (dialog.open) game.update(0, simulationTime, true);
  game.present(dialog.open ? 1 : accumulator * 30, dt);
  game.updateCamera(dt);
  if (pending && hero.position.distanceTo(pending.point) < 2) {
    const next = pending;
    pending = null;
    game.stop();
    if (next.enter) next.enter();
    else interact(next.name);
  }
  if (game.zone === "moor") {
    const region = MOOR_REGIONS.find(
      (r) => Math.hypot(hero.position.x - r.x, hero.position.z - r.z) < 10,
    );
    const label = region
      ? region.name.toUpperCase()
      : "THE OLD ROAD · HOSTILE TERRITORY";
    const safe = document.querySelector(".safe");
    if (safe.textContent !== label) safe.textContent = label;
  }
  const passagePoint = game.zone === "den" ? DEN_EXIT : DEN_GATE;
  const passageScreen = new THREE.Vector3(
    passagePoint.x,
    2,
    passagePoint.z,
  ).project(camera);
  areaPassage.hidden =
    game.zone === "camp" ||
    Math.abs(passageScreen.x) > 0.9 ||
    Math.abs(passageScreen.y) > 0.75;
  areaPassage.textContent =
    game.zone === "den" ? "Blood Moor · Exit" : "Den of Evil · Enter";
  areaPassage.style.left = `${(passageScreen.x * 0.5 + 0.5) * innerWidth}px`;
  areaPassage.style.top = `${(-passageScreen.y * 0.5 + 0.5) * innerHeight}px`;
  for (const npc of npcs) {
    const v = npc.point.clone();
    v.y = 2.65;
    v.project(camera);
    npc.label.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`;
    npc.label.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
    npc.label.hidden =
      game.zone !== "camp" ||
      v.z > 1 ||
      (-v.y * 0.5 + 0.5) * innerHeight < 78 ||
      (-v.y * 0.5 + 0.5) * innerHeight > innerHeight - 151;
  }
  for (const enemy of combat.enemies) {
    const rendered = game.enemyModels.get(enemy.id)?.userData.renderPosition;
    const v = new THREE.Vector3(
      rendered?.x ?? enemy.x,
      enemy.elite ? 3.4 : 2.25,
      rendered?.z ?? enemy.z,
    ).project(camera);
    enemy.label.hidden =
      game.zone === "camp" ||
      enemy.hp <= 0 ||
      v.z > 1 ||
      Math.abs(v.x) > 1 ||
      (-v.y * 0.5 + 0.5) * innerHeight < 86 ||
      (-v.y * 0.5 + 0.5) * innerHeight > innerHeight - 150;
    const edge = enemy.elite ? 64 : 42;
    enemy.label.style.left = `${Math.max(edge, Math.min(innerWidth - edge, (v.x * 0.5 + 0.5) * innerWidth))}px`;
    enemy.label.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
    enemy.label.querySelector("b").style.width =
      `${(enemy.hp / enemy.maxHp) * 100}%`;
    enemy.label.classList.toggle("winding", enemy.windup > 0);
    enemy.label.classList.toggle("chilled", enemy.slow > 0);
    enemy.label.classList.toggle("hovered", game.hoveredEnemy === enemy.id);
    enemy.label.classList.toggle("selected", combat.target === enemy.id);
  }
  const focused = combat.enemies.find(
    (e) => e.id === combat.target && e.hp > 0,
  );
  const targetInfo = document.querySelector("#target-info");
  targetInfo.hidden = !focused || game.zone === "camp";
  if (focused)
    targetInfo.textContent = `${focused.name} · ${Math.ceil(focused.hp)} / ${focused.maxHp}`;
  document.querySelector(".orb.red").textContent =
    `${Math.ceil(combat.allies[0].hp)} / ${combat.allies[0].maxHp}`;
  document.querySelector(".orb.blue").textContent =
    `${Math.floor(combat.mana)} / ${combat.stats.mana}`;
  document.querySelector(".orb.red").style.filter =
    combat.allies[0].hp < 40 ? "brightness(1.35)" : "none";
  document.querySelector(".level-bar i").style.width =
    `${xpProgress(state).percent}%`;
  const progress = xpProgress(state);
  document.querySelector("#xp-caption").textContent =
    `LEVEL ${progress.level} · ${progress.needed ? `${progress.current} / ${progress.needed} XP` : "LEVEL CAP"} · ${skillPoints(state)} TALENT POINT${skillPoints(state) === 1 ? "" : "S"}`;
  for (const ally of combat.allies) {
    const bar = document.querySelector(
      `.party-card[data-name="${ally.id}"] .health-line i`,
    );
    if (bar) bar.style.width = `${(ally.hp / ally.maxHp) * 100}%`;
  }
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const d = damageNumbers[i];
    d.life -= dt;
    const v = new THREE.Vector3(
      d.x,
      2.7 + (1 - d.life) + (d.lift || 0),
      d.z,
    ).project(camera);
    d.el.style.left = `${(v.x * 0.5 + 0.5) * innerWidth + (d.offset || 0)}px`;
    d.el.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
    d.el.style.opacity = Math.min(1, d.life * 2);
    if (d.life <= 0) {
      d.el.remove();
      damageNumbers.splice(i, 1);
    }
  }
  drawMap();
  const visibleDrops = new Set(combat.drops.map((d) => d.id));
  for (const [id, el] of lootLabels) {
    if (!visibleDrops.has(id)) {
      el.remove();
      lootLabels.delete(id);
    }
  }
  for (const drop of combat.drops) {
    let el = lootLabels.get(drop.id);
    if (!el) {
      el = document.createElement("button");
      const def = ITEMS[drop.item.itemId];
      el.className = `loot-label ${def.rarity}`;
      el.textContent = def.name;
      el.setAttribute("aria-label", `Collect ${def.name}`);
      el.onclick = () => {
        combat.cancel();
        pending = null;
        game.moveTo(new THREE.Vector3(drop.x, 0, drop.z));
      };
      document.querySelector("#loot-labels").append(el);
      lootLabels.set(drop.id, el);
    }
    const p = new THREE.Vector3(drop.x, 0.65, drop.z).project(camera);
    el.hidden =
      game.zone === "camp" ||
      Math.hypot(drop.x - hero.position.x, drop.z - hero.position.z) > 9 ||
      Math.abs(p.x) > 1 ||
      Math.abs(p.y) > 1;
    el.style.left = `${(p.x * 0.5 + 0.5) * innerWidth}px`;
    el.style.top = `${(-p.y * 0.5 + 0.5) * innerHeight}px`;
  }
  updateActionFeedback();
  renderer.render(game.scene, camera);
  preview?.render(now / 1000);
}
update();
requestAnimationFrame(frame);
if (import.meta.env.DEV)
  window.__camp = {
    getState: () => JSON.parse(JSON.stringify(state)),
    getHero: () => hero.position.toArray(),
    getCompanions: () =>
      companions.map((c) => ({
        visible: c.visible,
        position: c.position.toArray(),
      })),
    moveTo: (x, z) => game.moveTo(new THREE.Vector3(x, 0, z)),
    interact,
    action,
    enterMoor,
    enterDen,
    returnToCamp,
    beginNewExpedition,
    showSkills,
    showInventory,
    showParty,
    getCombat: () => combat,
    game,
  };
