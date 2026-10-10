EMBERFALL ORIGINAL ART — 2026-10-09

All raster artwork in this directory was generated for this project.
No Diablo game files, extracted textures, sprites or audio are included.

portraits.webp: seven portraits, horizontal order Wanderer, Ilyra, Bram,
Eira, Soren, Aldric, Nyx. Each cell 256 by 256.
items.webp: 4x4 icons, 320 pixels per cell. Row-major order:
worn sword, tempered sword, handaxe, hunting blade, frost saber,
ember cleaver, dawnsteel, leather armor, chainmail, robe, ring,
sun charm, potion, cleave, shield, rally.
orbs.webp: life then mana; two 512-pixel square cells.
stone.webp: original weathered dark stone UI surface.
earth.webp: original moss and soil material.

oak.webp and flame.webp: transparent foliage and natural fire artwork.
hero-appearances.webp: four columns, two rows of equipment illustrations.
hero-directions.webp: four facings, sword row followed by axe row.
companions-a.webp: four facings; Ilyra, Bram, Eira rows.
companions-b.webp: four facings; Soren, Aldric, Nyx rows.
npc-directions.webp: four facings; Akara, Charsi, Kashya rows.
Directional world sprites retain real alpha and a shared boot baseline.
monsters.webp: four facings; Fallen, Risen, elite Brute rows.

MOTION AND ENVIRONMENT ART — 2026-10-10
hero-sword-motion.webp and hero-axe-motion.webp: 4 columns x 4 rows,
384-pixel cells. Rows walk A, walk B, windup, strike.
companions-a-motion.webp: 4 columns x 6 rows, paired walks for Ilyra, Bram, Eira.
companions-b-motion.webp: 4 columns x 6 rows, paired walks for Soren, Aldric, Nyx.
monster-attacks.webp: 4 columns x 6 rows, windup/strike pairs for Fallen,
Risen and Brute. All motion atlases use the same four facing columns
and normalized 94-percent boot baseline as their idle counterparts.
camp-tents.webp: 2x2 cells, healer pavilion, smith awning, rogue tent,
traveller tent.
moor-props.webp: 2x2 cells, mossy rocks, grave, ruined wagon, dead oak.
ground-details.webp: 2x2 cells, firepit, cobblestones, grass, supplies.
camp-services.webp: 2x2 cells, waypoint, stash, forge, bench.
Environment cells are 768 pixels square with real alpha.

combat-effects.webp: original transparent 4x2 VFX atlas. Row-major order:
silver cleave, metal sparks, frost shards, healing wisps, protective sigil,
ember burst, shadow slash, holy light. The Moor portal reuses the sigil
with a cyan tint over the illustrated stone waypoint base.

camp-soil.webp: original neutral stony earth albedo for the camp.
contact-shadow.webp: original transparent soft oval contact shadow.
The Moor retains earth.webp as a separate repeated material.

COMPANION COMBAT ART — 2026-10-10
companions-a-attacks.webp and companions-b-attacks.webp: 4x6 atlases,
384-pixel cells. Paired release/strike and recovery rows for Ilyra, Bram,
Eira, then Soren, Aldric, Nyx; four existing facing columns.
projectiles.webp: 4x1 atlas, 512-pixel cells. Right-pointing arrow, frost
lance, healing mote and divine bolt; runtime rotates along flight direction.

talents.webp: 3x3 opaque 512-pixel icons, row-major Vitality, Iron Skin,
Last Stand, Weapon Mastery, Wide Arc, Executioner, Battle Flow, Bulwark,
Battle Cry. Original bronze-framed painted emblems on dark stone.

cave-props.webp: original generated transparent 2x2 atlas: limestone wall, cave entrance, ritual altar and stalagmite/bone cluster. Generated source retained at /workspace/generated_images/exec-662ab44e-0722-4018-a9fc-562a53fb02c9.png; converted to WebP for distribution.

MOTION ART — v0.12
hero-sword-strikes.webp and hero-axe-strikes.webp: original transparent 4x6 atlases, 384-pixel cells, foot baseline 361. Rows preparation, coil, contact, follow-through, recovery, guard. Columns front-right, front-left, rear-left, rear-right. Sources exec-0d79508a-36a3-449c-bc97-e49db5e05d5f.png and exec-3f85a2e2-b305-48f9-9597-503c575ea13b.png retained in /workspace/generated_images.
fallen-run.webp, risen-run.webp, brute-run.webp: original transparent 4x4 movement atlases, same facing order, cell dimensions and baseline. Sources exec-12861aea-4c11-4838-8d0f-184f538d64a3.png, exec-e6e03633-aa38-4d5a-889e-a81285b75c78.png, exec-fb93b39c-9f7c-49b4-ac81-6ee40172a5dd.png retained in /workspace/generated_images.
Longer hero walk experiments failed alternating-foot review and are not bundled.

MERCENARY EQUIPMENT AND MOTION DATA — v0.13
merc-weapons.webp: original generated 4x2 transparent atlas, 384-pixel cells. Row-major: hunting bow, frost bow, iron mace, oath hammer, renewal staff, glacial staff, paired steel daggers, Nightfang daggers. Source exec-cece6670-5e70-4942-99de-056f0e5cd9b1.png retained in /workspace/generated_images; resized and converted to WebP for distribution.
motion-flow.bin: numerical bidirectional optical-flow vectors derived from existing original character movement/attack atlases by scripts/build-motion-flow.py. Layout and frame pairs are recorded in src/motion-flow-data.json. No replacement character artwork or extracted game assets are included.


LONGER SPRITE SEQUENCES — v0.14
hero-sword/axe-passing.webp, hero-sword/axe-passing-opposite.webp: original generated passing-step poses. Accepted top-row sources exec-f872d657-9fa3-4a00-97a7-7879b33089eb.png and exec-8ce21598-e2c1-4843-8178-96b6ce0a9a08.png; opposite sources exec-5b69f8a7-e539-48fd-a31f-6268286165a7.png and exec-4438f420-b448-4e85-80e4-ef2351ca0fed.png. The redundant second rows of the passing sheets are not used.
hero-sword/axe-downstroke.webp: original generated four-facing pre-contact and post-contact poses, sources exec-96ac80a0-7c08-4a40-a25f-b8da08cc1c6e.png and exec-352e8196-cee9-4c06-b0e8-8bac435bd64d.png.
*-walk-sequence.webp: 16-frame baked gait per character/facing. hero-*-attack-sequence.webp: 33 frames; companions-*-attack-sequence.webp and monster-attack-sequence.webp: 17 per character. Generated offline by scripts/build-animation-sequences.py using RIFE interpolation of the original artwork. No inference model runs or downloads in the game. Original generated PNG sources remain in /workspace/generated_images. The v0.13 runtime motion-vector binary is removed from this version.
