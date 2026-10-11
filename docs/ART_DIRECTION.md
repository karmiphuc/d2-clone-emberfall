# Emberfall art direction

Approved baseline: **v0.20 hero/Bram pilot and v0.21 full cast**. The player explicitly approved this look and animation quality. Future character work should extend this approach. Changes that replace the baseline need a reviewed, in-game comparison before they become the default.

## Visual identity

Use a grounded, dark isometric fantasy world: weathered cloth, leather, muted metal, readable silhouettes and restrained elemental accents. Preserve the current camp, Blood Moor, ornate inventory panels and life/mana orbs as the visual context. Characters should remain readable against those backgrounds at normal game scale.

Role identity comes from silhouette, equipment, posture and a controlled palette. Ilyra uses green leather and a bow; Bram uses heavy pale armor, shield and mace; Eira uses ivory robes and a warm staff crystal; Soren uses blue robes and an icy crystal; Aldric uses gold armor, pale cloth and sword/shield; Nyx uses plum leather and paired daggers. Enemies use distinct anatomy: small red Fallen, ragged Risen, a stocky horned Ashen Brute and an armored skeletal Gravewarden.

Bosses should look substantial beside the hero without obscuring combat. Judge proportions inside the game, including elite scale, rather than from isolated source renders.

## Character and animation production

Use coherent skeletal poses rendered into directional sprites with the reproducible [rigged pipeline](../scripts/rigged/README.md). Outfit, weapon and body movement must share the same rig or an explicitly verified attachment. Inspect both hands, the weapon grip, string/draw motion, feet and complete weapon arcs before accepting a set.

Keep camera scale, light, exposure and ground origin fixed across every action belonging to an actor. Crop transparent margins without resizing the remaining pixels. Packed frame metadata must retain exact root offsets, and the renderer must apply current-frame transforms before drawing. No frame should clip feet, cloth or weapons.

Preserve sixteen hero facings and at least eight facings for companions and creatures. The baseline uses 48 walk samples for the party/Fallen, 64 for the Brute and 96 for slow undead; hero attacks use 33 samples, companion release/recovery uses 17, and enemy windup/death uses 33. These counts are reference values, not proof of smoothness: review actual playback, transitions and silhouettes.

Walking follows displacement and calibrated stride, with supporting-foot correction where appropriate. Elite scaling also scales the stride. Keep continuous loops and gradual facing changes. Idle should remain a stable, intentional pose; patrols need sustained walks and deliberate pauses rather than repeated tiny starts and stops. Different attack variants must be complete, coherent actions selected at action boundaries.

Attacks need readable anticipation, contact, follow-through and recovery. Synchronize contact with gameplay damage/projectile events. Avoid idle flashes between phases, changing body size, lighting flicker, disconnected equipment and generic movement layered over an already animated gait. Creature deaths use authored rig poses.

## Acceptance and reference material

Review the changed actor in camp or its combat area at normal scale. Capture walking, stopping, idle, turning, attacks and equipment changes across multiple facings. For enemies, include windup, damage, recovery and death. Test several copies together so shared resources cannot corrupt individual poses. Check an unengaged patrol over multiple walk/pause cycles.

Use a moving ground reference to inspect foot contact, then review the real scene. Check consistent opacity and lighting, attached weapon grips, stable idle silhouettes and smooth action boundaries. Frame counts and automated tests supplement this visual review; they do not replace it or establish device performance.

References: [v0.21 camp](screenshots/rigged-company-v0.21.png), [full-cast runtime reel](screenshots/rigged-company-v0.21.webm), [atlas calibration](rigged-company-v0.21.json), [v0.21 QA](qa-v0.21.md). The reel is captured at 30 fps and uses controlled actions; it is a presentation reference rather than a gameplay timing or hardware benchmark.

The v0.21.1 [bow and patrol fixes](qa-v0.21.1.md) refine this baseline: attached bow geometry, preserved string motion and stable idle pauses are required going forward. Use its corrected archer and patrol reels when reviewing those behaviors.

Retain source revisions, licenses, dependency hashes and rebuild instructions. See [third-party attribution](../THIRD_PARTY.md). New asset sources must have clear permission for their intended distribution.

## Combat presentation

Keep enemy UI to identity, life and meaningful conditions. Do not add windup/cooldown bars, flashing attack outlines or changing strike/recovery instructions. Boss anticipation belongs in its authored pose and restrained directional ground tell. Hero skill cooldowns remain useful player controls.

Effects support contact and follow-through without covering bodies or attached weapons. Use brief, directional slashes and small contact accents; keep fire, frost and healing translucent and restrained. Honor softened effects and reduced motion.

Sound follows gameplay events: a single bow release per volley, each surviving projectile's impact at arrival, and healing at delivery. Differentiate physical swishes/thuds, bow strings and magic; layer low weight into heavy blows while limiting total voices and fading distant combat. Sound is opt-in and the control must remain accessible on phones. See the [v0.23 presentation review](qa-v0.23.md).

Keep the playfield free of routine briefings and success notifications. Area transitions and restored retreats should not require a dialog. Journal details are collapsed until requested; quest tracking and control reminders are optional. Essential life/mana, party health, skills and navigation remain available. Opening a panel cancels pending NPC approaches, and menu shortcuts toggle or switch the single active panel. See the [v0.24 UI review](qa-v0.24.md).

Monster targeting uses direct silhouette clicks/taps and a steady red outside contour on the selected living creature. Do not restore floating name/health boxes or apply a selection brightness wash. The contour follows the exact current packed frame, preserves the authored root and body pixels, masks adjacent atlas artwork and stays about three CSS pixels wide as render resolution changes. Hover inspection must not steal this marker from the selected target. A keyboard focus indicator and accessible attack buttons remain available; the identity/health panel stays separate from creature artwork. See the [v0.25 targeting review](qa-v0.25.md).
