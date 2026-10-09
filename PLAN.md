# Chapter I implementation plan

## Current milestone: camp and first expedition

Playable camp, party movement and town services. Built with Three.js, original procedural environment/character geometry and a DOM interface. One player-controlled warrior and three recruitable companions. Device-local persistence; desktop-first controls. Blood Moor now includes an authored 12-enemy encounter, elite, companion combat, persistent drops, defeat recovery and a one-time camp reward.

## Next: Den of Evil vertical slice

1. Extract fixed-step simulation, collision and navigation from rendering.
2. Build Blood Moor connected to the camp, keeping existing services and party state.
3. Add melee hit timing, enemy perception and pathing, damage, death, drops, pickup and equipment.
4. Give the scout, shield mercenary and adept one signature ability each; test hazard avoidance and focus-target commands.
5. Add Den of Evil with authored entrance, generated connected rooms, clear objective, reward and return portal.
6. Validate a continuous 30–45 minute town/exploration/combat/reward session before expanding content.

## Full chapter sequence

Den of Evil → Burial Grounds/Blood Raven → Dark Wood and Tristram/Cain → Forgotten Tower/Countess → Barracks/Smith and Malus → Jail/Cathedral/Catacombs/Andariel. Preserve optional quests and side dungeons. Every quest includes discoverability, journal, dialogue, rewards and persistent world changes.

## Systems expansion

Three hero archetypes; companion talents and equipment; item rarity and affixes; inventory grid; vendors and identification; portals and waypoints; downed allies and party defeat; saved seeds and exploration; versioned data schemas. Single-player first. Networking is a distinct later project.

## Risks to resolve early

Companion navigation through doors; combat readability with four allies; browser performance under enemy and effect load; procedural connectivity; save migrations. Current polygonal art is a prototype visual direction, not a recreation of Diablo II's final asset quality.

## Done means

A fresh save can complete all six quests through Andariel, with working optional areas, durable progress, reliable party navigation and balanced hero/companion combinations. The camp-only prototype does not yet satisfy this chapter completion criterion.
