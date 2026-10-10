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
