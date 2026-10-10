# Chapter I implementation plan

## Current milestone: connected Den of Evil

Playable camp, Blood Moor and an authored three-chamber Den of Evil. One warrior plus three of six recruitable companions; original painted character/environment art; device-local persistence. The Moor has 12 enemies and repeat hunts, levels 1–6, 27 equipment types and nine talents. The Den adds eleven creatures, the Gravewarden, separate persistent loot and a one-time Akara bounty. Its fixed footprint drives navigation, wall-aware attacks and the minimap. Area changes preserve party vitals; camp restores them.

## Next: expand the chapter route

1. Extend the wilderness toward Burial Grounds and create a distinct boss/quest loop.
2. Expand companion tactics and add longer, smoother character animation cycles.
3. Add dungeon wall/room variety and richer encounter placement.
4. Continue extracting scene/navigation responsibilities before larger maps.
5. Validate a continuous 30–45 minute session and real-device performance before widening the campaign.

## Full chapter sequence

Den of Evil → Burial Grounds/Blood Raven → Dark Wood and Tristram/Cain → Forgotten Tower/Countess → Barracks/Smith and Malus → Jail/Cathedral/Catacombs/Andariel. Preserve optional quests and side dungeons. Every quest includes discoverability, journal, dialogue, rewards and persistent world changes.

## Systems expansion

Three hero archetypes; companion talents and equipment; item rarity and affixes; inventory grid; vendors and identification; portals and waypoints; downed allies and party defeat; saved seeds and exploration; versioned data schemas. Single-player first. Networking is a distinct later project.

## Risks to resolve early

Companion navigation through doors; combat readability with four allies; browser performance under enemy and effect load; procedural connectivity; save migrations. Current four-facing painted art and short animation cycles remain an interpretation of the classic visual direction, not a reproduction of Diablo II's asset quality.

## Done means

A fresh save can complete all six quests through Andariel, with working optional areas, durable progress, reliable party navigation and balanced hero/companion combinations. The current camp/Moor/Den slice does not yet satisfy this chapter completion criterion.
