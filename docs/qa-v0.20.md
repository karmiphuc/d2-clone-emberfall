# v0.20 — Rigged animation pilot

The hero and Bram now use coherent skeletal poses rendered to sprites. The other five mercenaries retain their existing painted animations; this is a two-character evaluation, not a completed party art replacement.

The pilot has 48 walk samples, 16 hero directions and eight Bram directions. Hero sword/axe attacks have 33 samples; Bram's mace release/recovery has 17. Fixed camera scale and lighting prevent per-pose exposure or size normalization. Packed rectangles store exact ground origins, and the renderer updates each changed sprite transform before drawing it.

Ground displacement advances the gait by a calibrated 3.5588-unit stride. The supporting toes are corrected with two-bone IK during the two stance intervals. [Rig traces](rigged-pilot-v0.20.json) measure maximum toe height and linear backward trajectory errors below 0.000001 model units. These are skeleton-space checks; rasterization, discrete facings and turning can still produce visible foot motion. This does not claim perfect foot locking or hardware frame-rate measurements.

[Pose review](screenshots/rigged-poses-v0.20.png), [camp screenshot](screenshots/rigged-camp-v0.20.png) and [isolated runtime reel](screenshots/rigged-pilot-v0.20.webm) show the pilot. The reel uses controlled fixed-direction poses from the actual sprite renderer, with the scenery and UI hidden. Walk and attack panels repeat independently; looped attacks in the reel are not gameplay attack-rate measurements. The source is comparatively low-poly and differs visibly from the other characters' painted artwork.

Local verification includes 69 unit tests and ten focused browser checks covering all six companion roles, turning, settling, Hold, attack contact/recovery, automatic attacks, sword/axe switching, frame bounds, atlas packing and presentation clocks. A rendering regression check ensures each attack frame uses its current scale in the world matrix. Production smoke checks cover phone layout, mercenary weapon/armor persistence, Blood Moor auto-combat and map navigation. Full-suite deployment and public-build checks are recorded in GitHub Actions.

The source download and Blender export are reproducible through [the asset pipeline](../scripts/rigged/README.md). Artwork attribution and adaptation details are in [THIRD_PARTY.md](../THIRD_PARTY.md); the game also displays source and license links in Settings.
