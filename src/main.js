import * as THREE from "three";
import "./style.css";
import { createWorld } from "./world.js";

const defaults = {
  gold: 240,
  potions: 3,
  quest: false,
  visited: [],
  roster: ["Ilyra", "Bram", "Eira"],
  weapon: false,
  stash: 0,
};
let state = { ...defaults };
try {
  const s = JSON.parse(localStorage.getItem("emberfall-camp-v1"));
  if (s && s.version === 1) state = { ...defaults, ...s };
} catch {}
const save = () => {
  try {
    localStorage.setItem(
      "emberfall-camp-v1",
      JSON.stringify({ ...state, version: 1 }),
    );
  } catch {
    toast("Browser storage unavailable. Progress lasts for this session.");
  }
};
const app = document.querySelector("#app");
app.innerHTML = `<canvas id="world" aria-label="Playable encampment. Click to move, or use WASD. Press E near a towns-person to interact."></canvas><div id="vignette"></div><div class="labels" id="labels"></div>
<header class="top"><div><div class="brand">EMBERFALL</div><div class="edition">CHAPTER I · CAMP PLAYTEST</div></div><div class="place"><div class="eyebrow">The western kingdoms</div><h1>Rogue Encampment</h1><div class="safe">SANCTUARY</div></div><div class="top-actions"><button class="icon-button optional" id="sound" title="Toggle ambient sound" aria-label="Toggle ambient sound">♫</button><button class="icon-button" id="help" title="Controls" aria-label="Controls">?</button><button class="icon-button" id="settings" title="Settings" aria-label="Settings">⚙</button></div></header>
<aside class="party" id="party" aria-label="Your party"></aside><aside class="quest"><div class="eyebrow">Quest journal</div><h2 id="quest-title">A light in the darkness</h2><p id="quest-text">Speak to Akara.<br>Find your footing in camp.</p><button id="journal-link">OPEN JOURNAL &nbsp; [J]</button></aside>
<div class="minimap"><span class="north">N</span><div class="map-frame"><canvas id="map" width="274" height="216"></canvas></div><div class="map-caption">ROGUE ENCAMPMENT</div></div>
<div class="controls">CLICK TO MOVE <span>·</span> WASD <span>·</span> E INTERACT <span>·</span> SPACE REGROUP</div><div class="chapter"><strong>ACT I · THE SIGHTLESS EYE</strong><span id="save-note">PROGRESS SAVED ON THIS DEVICE</span></div>
<footer class="bottom"><div class="orb-wrap"><div class="orb red">120 / 120</div><div class="orb-label">LIFE</div></div><div class="hotbar"><div class="level-bar"><i></i></div><div class="slots"><button class="slot" data-action="attack" title="Practice swing [1]"><kbd>1</kbd>⚔</button><button class="slot" data-action="guard" title="Guard stance [2]"><kbd>2</kbd>⛨</button><button class="slot" data-action="rally" title="Regroup party [3]"><kbd>3</kbd>⚑</button><button class="slot" data-action="heal" title="Healing potion [4]"><kbd>4</kbd>♜<small id="potions">3</small></button><button class="slot" data-action="hold" title="Hold / follow [5]"><kbd>5</kbd>✥</button><button class="slot" data-action="portal" title="Return to campfire [6]"><kbd>6</kbd>◉</button></div><nav class="bar-menu"><button id="character">CHARACTER <kbd>C</kbd></button><button id="inventory">INVENTORY <kbd>I</kbd></button><button id="journal">JOURNAL <kbd>J</kbd></button><button id="party-menu">PARTY <kbd>P</kbd></button></nav></div><div class="orb-wrap"><div class="orb blue">60 / 60</div><div class="orb-label">MANA</div></div></footer><div class="toast" role="status" id="toast"></div><dialog id="dialog" aria-labelledby="dialog-title"><button class="close" aria-label="Close dialog">×</button><div id="dialog-content"></div></dialog>`;
const dialog = document.querySelector("dialog"),
  content = document.querySelector("#dialog-content");
let toastTimer;
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
}
function modal(title, body, actions = [], eyebrow = "Rogue Encampment") {
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
const roster = {
  Ilyra: { role: "Rogue scout", symbol: "♜", color: "#9cad79" },
  Bram: { role: "Shield mercenary", symbol: "⛨", color: "#c1a37f" },
  Eira: { role: "Traveling adept", symbol: "✧", color: "#b1a1cf" },
};
function update() {
  document.querySelector("#potions").textContent = state.potions;
  document.querySelector("#party").innerHTML =
    `<button class="party-card" data-name="hero"><div class="portrait" data-level="1">⚔</div><div><div class="member-name">The Wanderer</div><div class="health-line"><i style="width:100%"></i></div><div class="member-role">WARRIOR · YOU</div></div></button>` +
    Object.entries(roster)
      .map(
        ([name, r]) =>
          `<button class="party-card" data-name="${name}" style="opacity:${state.roster.includes(name) ? 1 : 0.4}"><div class="portrait" data-level="1">${r.symbol}</div><div><div class="member-name">${name}</div><div class="health-line"><i style="width:${state.roster.includes(name) ? 100 : 0}%"></i></div><div class="member-role">${state.roster.includes(name) ? r.role.toUpperCase() : "IN RESERVE"}</div></div></button>`,
      )
      .join("");
  document
    .querySelectorAll(".party-card")
    .forEach(
      (b) =>
        (b.onclick = () =>
          b.dataset.name === "hero" ? showCharacter() : showParty()),
    );
  companions.forEach(
    (c, i) => (c.visible = state.roster.includes(Object.keys(roster)[i])),
  );
  document.querySelector("#quest-title").textContent = state.quest
    ? "Prepare for the wilderness"
    : "A light in the darkness";
  document.querySelector("#quest-text").innerHTML = state.quest
    ? `${state.visited.length}/3 camp services visited.<br>${state.visited.length === 3 ? "Camp preparations complete." : "Meet Charsi, Kashya, and the stash."}`
    : "Speak to Akara.<br>Find your footing in camp.";
  save();
}
function visited(id) {
  if (!state.visited.includes(id)) {
    state.visited.push(id);
    update();
  }
}
function showCharacter() {
  modal(
    "The Wanderer",
    `<p>A traveler on the western road. A sword, a few coins, and three souls willing to stand beside you.</p><div class="item-row"><span>Class</span><strong>Warrior · Level 1</strong></div><div class="item-row"><span>Life / Mana</span><strong>120 / 60</strong></div><div class="item-row"><span>Weapon</span><strong>${state.weapon ? "Tempered longsword" : "Worn longsword"}</strong></div><div class="item-row"><span>Attack damage</span><strong>${state.weapon ? "12–18" : "6–10"}</strong></div><p class="muted">Combat progression begins beyond the camp in a future build.</p>`,
  );
}
function showInventory() {
  modal(
    "Your belongings",
    `<div class="item-row"><span>${state.weapon ? "Tempered" : "Worn"} longsword</span><span>Equipped</span></div><div class="item-row"><span>Traveler’s armor</span><span>Equipped</span></div><div class="item-row"><span>Healing potions</span><span>× ${state.potions}</span></div><div class="item-row"><span>Town portal stone</span><span>Reusable</span></div><p class="gold">◈ ${state.gold} gold carried · ${state.stash} in stash</p>`,
  );
}
function showJournal() {
  modal(
    "A light in the darkness",
    state.quest
      ? `<p>Akara has asked you to prepare your company before venturing beyond the palisade.</p>${["Charsi", "Kashya", "Stash"].map((n) => `<div class="item-row"><span>${n}</span><span>${state.visited.includes(n) ? "✓ Visited" : "Not yet visited"}</span></div>`).join("")}<p>${state.visited.length === 3 ? "Your company is ready. The wilderness chapter is the next build." : "Visit the blacksmith, recruitment post, and shared stash."}</p>`
      : "<p>The encampment is the last safe haven on the western road. Find Akara near the violet tent and learn what troubles these lands.</p>",
    [],
    "Act I · Camp preparations",
  );
}
function showParty() {
  modal(
    "Your company",
    `<p>One hero. Three companions. Your company follows you through the camp.</p>`,
    Object.entries(roster).map(([name, r]) => ({
      label: `${state.roster.includes(name) ? "Dismiss" : "Recruit"} ${name} · ${r.role}${state.roster.includes(name) ? "" : " · Free"}`,
      run: () => {
        if (state.roster.includes(name))
          state.roster = state.roster.filter((n) => n !== name);
        else {
          state.roster.push(name);
          companions[Object.keys(roster).indexOf(name)].position
            .copy(hero.position)
            .add(new THREE.Vector3(1, 0, 1));
        }
        update();
        showParty();
      },
    })),
    "Kashya · Recruitment",
  );
}
function interact(id) {
  if (id === "Akara") {
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
      `<p>“A good blade is a promise. Let me make sure yours keeps it.”</p><div class="item-row"><span>Tempered longsword</span><span>12–18 damage</span></div><p class="gold">◈ ${state.gold} gold</p>`,
      [
        {
          label: state.weapon
            ? "Tempered longsword equipped"
            : "Buy & equip longsword · 100 gold",
          disabled: state.weapon || state.gold < 100,
          run: () => {
            state.gold -= 100;
            state.weapon = true;
            update();
            interact(id);
            toast("Tempered longsword equipped.");
          },
        },
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
            game.returnHome();
            toast("Returned to the campfire.");
          },
        },
      ],
    );
  if (id === "Blood Moor")
    modal(
      "Beyond the palisade",
      '<p>The road leads into the Blood Moor. For this first playtest, the explorable area ends at the camp.</p><p class="muted">Next: wilderness encounters, loot drops, and the Den of Evil.</p>',
      [{ label: "Return to camp", run: () => dialog.close() }],
      "Chapter I · Next expedition",
    );
}
let pending = null;
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
function action(name) {
  if (name === "rally") {
    game.hold = false;
    game.regroup();
    toast("Your company gathers around you.");
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
    game.returnHome();
    toast("Returned to the campfire.");
  }
  if (name === "attack") {
    game.swing();
    toast("Practice swing · The camp is a sanctuary.");
  }
  if (name === "guard") {
    game.pulse(0xd5bd78);
    toast("Guard stance · Ready for what lies beyond.");
  }
  if (name === "heal") {
    if (state.potions === 0)
      return toast("No healing potions. Visit Akara to buy more.");
    toast("Life is already full. Potion preserved.");
  }
}
document
  .querySelectorAll("[data-action]")
  .forEach((b) => (b.onclick = () => action(b.dataset.action)));
document.querySelector("#character").onclick = showCharacter;
document.querySelector("#inventory").onclick = showInventory;
document.querySelector("#journal").onclick = showJournal;
document.querySelector("#journal-link").onclick = showJournal;
document.querySelector("#party-menu").onclick = showParty;
const help = () =>
  modal(
    "The road begins here",
    '<p>Explore the camp and meet its inhabitants. Click a name to approach and talk.</p><div class="item-row"><span>Move</span><span>Click ground / WASD</span></div><div class="item-row"><span>Interact nearby</span><span>E</span></div><div class="item-row"><span>Regroup companions</span><span>Space / 3</span></div><div class="item-row"><span>Hold / follow</span><span>5</span></div><div class="item-row"><span>Zoom</span><span>Mouse wheel</span></div><div class="item-row"><span>Inventory / journal / party</span><span>I / J / P</span></div><p class="muted">Progress is saved locally on this browser. This build contains the camp; wilderness combat comes next.</p>',
  );
document.querySelector("#help").onclick = help;
document.querySelector("#settings").onclick = () =>
  modal("Camp settings", "<p>Adjust the scene for your device.</p>", [
    {
      label: game.low ? "Enable detailed shadows" : "Use performance mode",
      run: () => {
        game.low = !game.low;
        renderer.shadowMap.enabled = !game.low;
        renderer.setPixelRatio(Math.min(devicePixelRatio, game.low ? 1 : 1.75));
        dialog.close();
        toast(
          game.low ? "Performance mode enabled." : "Detailed shadows enabled.",
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
                state = {
                  ...defaults,
                  roster: [...defaults.roster],
                  visited: [],
                };
                update();
                game.returnHome();
                dialog.close();
                toast("A new journey begins.");
              },
            },
            { label: "Keep my progress", run: () => dialog.close() },
          ],
        ),
    },
  ]);
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
    toast("Ambient wind enabled.");
  } else {
    if (audio.state === "running") {
      await audio.suspend();
      toast("Ambient sound muted.");
    } else {
      await audio.resume();
      toast("Ambient wind enabled.");
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
    const npc = [...npcs].sort(
      (a, b) =>
        a.point.distanceTo(hero.position) - b.point.distanceTo(hero.position),
    )[0];
    if (npc.point.distanceTo(hero.position) < 4) interact(npc.name);
    else toast("Move closer to a towns-person or click their name.");
  }
  if (k === "i") showInventory();
  if (k === "j") showJournal();
  if (k === "c") showCharacter();
  if (k === "p") showParty();
  if (e.code === "Space") action("rally");
  if (/^[1-6]$/.test(k))
    action(
      ["attack", "guard", "rally", "heal", "hold", "portal"][Number(k) - 1],
    );
});
const map = document.querySelector("#map"),
  ctx = map.getContext("2d");
const pos = (p) => [137 + p.x * 5.3, 108 + p.z * 5.3];
function drawMap() {
  ctx.clearRect(0, 0, 274, 216);
  ctx.strokeStyle = "#8f90604d";
  ctx.lineWidth = 1;
  ctx.strokeRect(33, 24, 208, 170);
  ctx.fillStyle = "#726d5055";
  for (const o of game.obstacles) {
    let [x, z] = pos(o);
    ctx.fillRect(x - o.w * 2.65, z - o.d * 2.65, o.w * 5.3, o.d * 5.3);
  }
  ctx.strokeStyle = "#90886b44";
  ctx.beginPath();
  ctx.moveTo(137, 40);
  ctx.lineTo(137, 188);
  ctx.moveTo(65, 108);
  ctx.lineTo(241, 108);
  ctx.stroke();
  for (const n of npcs) {
    ctx.fillStyle = n.name === "Akara" ? "#d6b575" : "#859983";
    const [x, z] = pos(n.point);
    ctx.fillRect(x - 2, z - 2, 4, 4);
  }
  for (const c of companions.filter((c) => c.visible)) {
    const [x, z] = pos(c.position);
    ctx.fillStyle = "#99b3a1";
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
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.update(dt, now / 1000, dialog.open);
  if (pending && hero.position.distanceTo(pending.point) < 2) {
    const id = pending.name;
    pending = null;
    game.stop();
    interact(id);
  }
  for (const npc of npcs) {
    const v = npc.point.clone();
    v.y = 2.65;
    v.project(camera);
    npc.label.style.left = `${(v.x * 0.5 + 0.5) * innerWidth}px`;
    npc.label.style.top = `${(-v.y * 0.5 + 0.5) * innerHeight}px`;
    npc.label.hidden = v.z > 1;
  }
  drawMap();
  renderer.render(game.scene, camera);
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
    game,
  };
