# v0.22 — Living Moor and boss hunts

The camp/Moor/Den slice now has 112 Moor enemies, eleven Den creatures, six repeatable named bosses, 69 equipment types and levels 1–10. This expands the existing slice; Burial Grounds and the rest of Act I remain unfinished.

## Population and save rules

Regular enemies and roaming bosses replenish on departure from camp after their drops are collected. Collected enemies also return after 90 simulation seconds when every living active ally is more than 18 world units from their original spawn. Paused dialogs/tabs do not advance this timer. The field timer restarts when loading an area; returning from a loaded camp can replenish collected slots immediately.

Loose drops prevent replenishment of their slots. Each population generation receives a distinct item UID and grants fresh XP/gold. Permanent quest credit is separate from current population deaths. The old-road Ashen Brute and Den Gravewarden are quest bosses and never replenish. Both Akara bounties remain one-time; earlier saves with a paid road bounty migrate to completed road credit even if their old repeat hunt erased kills. Save additions remain compatible with version 2.

## Encounters and impact

Embercallers maintain range, retreat when pressed during cooldown, and release visible ember bolts before damage. Armored Risen Bulwarks reduce damage by 25%; raiders move faster than ordinary Fallen. Six outer-region bosses have guaranteed, distinct equipment trophies; the Gravewarden grants Graveward rather than another Ashen charm.

Melee elites lock an attack direction at windup. Their visible, narrow ground arrow represents a committed **single-target** strike, not collateral area damage. A close sidestep can avoid it; Guard remains an alternative. Elites recover for 0.6 seconds and enrage below half life. Cleave interrupts regular foes but leaves boss commitment intact. Heavy contact adds directional recoil, larger impact/damage presentation, low-frequency opt-in sound and a brief restrained camera impulse. Softened/reduced effects disable the impulse. Approved actor atlases, fixed lighting and equipment grips are preserved.

Haste speeds hero attacks and companion casts; life steal restores life at damage contact for hero or mercenary equipment. Frost weapons chill. New weapon types select the existing coherent sword/axe or class rig. Inventory comparisons include these bonuses. The gate/journal hunting ledger provides region, tactics, suggested level and trophy previews; the focus panel shows boss/champion identity, enrage and recovery. Offscreen labels skip DOM presentation updates.

## Evidence and checks

- 90 unit checks cover migration, partial replenishment, loot preservation, one-time rewards, party exclusion radius, quest-boss permanence, fresh item generations, committed misses/recovery, hostile projectile arrival, Cleave interrupts, distinct trophies and actual haste/life-steal contact.
- Focused browser checks exercise the entire road progression/party/gear loop, Den clear/loot/bounty after replenishment, 112 valid spawn positions, mobile ledger, real ranged contacts, movement cancellation and rigged weapon equipment.
- New browser regressions kill, collect, replenish, kill again and reload; verify fresh rewards and a permanently dead quest boss; verify a visible locked boss tell, a close sidestep miss, stable facing and readable recovery. The release workflow runs all 38 browser checks plus unit checks/build before publishing.
- [Boss encounter recording](screenshots/boss-hunt-v0.22.webm) and [runtime trace](boss-hunt-v0.22.json): 105 simulation/render samples at 30 fps, normal game scale, existing world/UI. The staged level-five party faces Mournfang and an Embercaller; actual keyboard movement leaves the initial committed strike, followed by re-engagement, enrage, heavy contact and death onset. Bram's taunt is held on cooldown to isolate the hero-facing dodge. This is presentation evidence, not a roster-balance or hardware-FPS benchmark.
- [Boss tell](screenshots/boss-tell-v0.22.png), [enraged combat](screenshots/boss-combat-v0.22.png), [desktop ledger](screenshots/hunt-ledger-v0.22.png), [phone ledger](screenshots/hunt-ledger-mobile-v0.22.png) and [equipment](screenshots/hunt-gear-v0.22.png) capture the completed source.

The bosses reuse approved rigs with different stats and encounter behavior; they do not have newly authored anatomy or unique action atlases. Sustained real-device frame rate, late-level economy and broader roster balance still need player testing. No hardware-performance claim follows from headless software rendering.
