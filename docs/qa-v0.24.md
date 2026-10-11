# v0.24 — Play first, details on demand

The eastern gate now starts the Blood Moor directly. The former mandatory expedition briefing is removed; Journal contains the same six boss hunts and respawn information inside a closed-by-default disclosure in camp, Moor and Den. Normal departure still renews collected packs, preserves loose drops and keeps quest bosses dead.

Quest tracking, the control reminder strip and routine notifications start hidden. Settings can enable each preference independently, persisted under a separate browser key without changing save version 2. Routine loot/equipment, sound, Hold/Rally, entry and healing confirmations stay quiet by default. Actionable failures, bag overflow and downed companions remain visible; level-up keeps one existing banner. Repeated floating companion skill names follow the routine-notification preference.

Defeat restores the company to camp with the same gold loss, communicated in a short notice rather than a compulsory rest dialog. The waypoint's single-destination dialog and duplicate floating Town button are removed; Town [6] still returns to camp. NPC services, equipment, skills, party management and Help open on deliberate request.

I/C/J/P/K toggle the current panel or switch directly to another. Input/select fields retain their own typing behavior, and Escape remains available. Opening a menu stops the hero and cancels a queued NPC visit, preventing a service dialog from replacing the panel at arrival. Service/party role subtitles appear on hover or keyboard focus.

## Review evidence

- [Desktop camp](screenshots/quiet-camp-v0.24.png), [phone camp](screenshots/quiet-camp-mobile-v0.24.png), [collapsed phone Journal](screenshots/quiet-journal-mobile-v0.24.png) and [direct Moor entry](screenshots/quiet-moor-v0.24.png) capture the completed source at normal game scale. The phone viewport is 390 × 844.
- Browser coverage exercises quiet defaults, Sound/Hold without confirmation messages, panel switching/toggling, collapsed hunt details, actual gate approach/direct entry, Town return, preference reload persistence, and cancellation of a pending NPC visit. Existing expedition coverage verifies the unchanged defeat gold loss and restored health without a modal, repeating hunts, save credit, vendor transactions and mercenary equipment.
- All existing actor atlases, motion clips, combat effects/audio and gameplay timing remain unchanged. This release changes interaction and visibility, not character art.

Astra review is disabled by explicit user request and recorded in AGENTS.md. No review agent was launched for this release. The release workflow requires the full unit/browser suite and build before Pages publication.
