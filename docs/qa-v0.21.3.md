# v0.21.3 — Companion contact and recovery

This implements the first combat refinement discussed with Astra High. The approved rig-rendered atlases, fixed roots and lighting remain the visual baseline.

## Action and contact

Companion body actions begin once per attack. Ilyra's volley starts one aimed bow action and releases up to three independently timed arrows; it no longer re-faces/restarts her pose once per target. Ranged damage and Eira's healing resolve from a small simulation-owned impact queue after the same flight duration supplied to the visual effect. Frostburst's damage, slow and explosion happen at arrival. Melee contact still uses the existing release action.

Flights target the original creature or ally and track its current position; they do not switch targets or introduce ballistic dodge rules. Damage/healing values are captured at release. Impact rechecks line of sight from the release point. Dead targets fizzle, healing never revives a fallen ally, and released missiles may finish after their caster falls. Contacts use the existing centralized hit/kill/XP/drop path, so simultaneous lethal flights cannot duplicate rewards. Area changes and camp restoration invalidate queued impacts with an area generation; flights are not serialized into saves.

The simulation runs at thirty fixed ticks per second. Arrival is resolved on the first tick reaching the flight duration, so visual/contact precision is bounded by that tick interval. Pause stops both simulation and effect timers. This is a timing correction, not a new projectile physics system.

## Movement out of attacks

Manual movement clears hero recovery presentation and its interpolation history, starts the calibrated gait at its contact pose and preserves the gameplay cooldown. Keyboard, mouse-ground and touch-ground inputs are covered. A cancelled windup still spends no cleave mana and deals no damage.

Creatures stay planted for their 0.26-second release/recovery before resuming pursuit. Their cooldown continues counting down during recovery. This slightly reduces immediate pursuit pressure when a victim moves after contact; it does not extend the attack cooldown itself.

## Review and verification

[In-game action recording](screenshots/action-contact-v0.21.3.webm) shows volley flight/impact, Eira's healing and hero attack-to-walk transitions at normal scale using the actual simulation, renderer and UI. The [runtime trace](action-contact-v0.21.3.json) records three arrows and a healing mote before contact; hero recovery exits directly into walk at input, with no intervening idle clip. The established all-role release/recovery, Brute contact/death and Gravewarden checks remain part of verification.

Unit regressions cover one-action volleys, delayed contacts, lethal races, dead targets, caster death, moving targets, blocked flight paths, area/restoration cleanup, healing priority and enemy recovery. Browser regressions check three visible arrows before damage and real keyboard/mouse/touch recovery exits with retained cooldowns.

This workspace uses headless Chromium with software rendering. Its captures and renderer counts establish functional/visual behavior, not real-device FPS. Named desktop/mobile frame-time profiling remains necessary before claiming a hardware smoothness improvement or selecting performance optimizations. The next gameplay milestone is a reviewed Gravewarden directional attack, bounded companion positioning changes and a distinct Den reward.
