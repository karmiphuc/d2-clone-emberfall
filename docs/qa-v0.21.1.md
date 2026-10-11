# v0.21.1 — Art direction and animation fixes

The approved [art direction](ART_DIRECTION.md) now defines the visual baseline, role silhouettes, rig-to-sprite workflow, stable roots/lighting, weapon attachment and required in-game review. `AGENTS.md`, contributing guidance and the development README link to it. Legacy painted-frame interpolation tooling is identified as historical rather than the production workflow.

## Patrol reproduction and fix

An eight-second simulation/render probe found 145 idle/walk switches on several unengaged Briar Thicket creatures. The old circular destination kept moving while the creature stopped at a small arrival threshold, producing repeated tiny starts and stops.

Patrols now walk to a fixed local destination at up to 0.9 units/second, then pause for 1.4–2 seconds before choosing another. Blocked destinations produce a pause and a later new destination. Threat detection precedes patrol pausing, so nearby enemies can still engage immediately. Hunt progression and combat damage are unchanged.

Regression coverage checks multiple walk/pause cycles, bounded movement, blocked destinations and aggro during a pause. A runtime browser test renders six unengaged creatures over eight seconds and checks both the number of clip transitions and the exact packed frame throughout settled idle periods. [Patrol review](screenshots/patrol-v0.21.1.webm) uses the actual simulation and renderer over a ground reference.

## Bow attachment

The original shortbow had two armature modifiers: one for the character's off hand and another for its string. glTF permits one skin per mesh, so the exported bow lost the body attachment and floated near its bind position.

The exporter now keeps one off-hand skin and samples the second armature's deformation into shape keys for the string vertices. Human exports retain only assigned actions; including every compatible action on the remaining single armature would merge unused source poses into the body animation. A comparison against the previous female export confirms all 81 body animation channels match within 0.00001 (quaternion signs treated as equivalent). This preserves the approved body poses and the source draw/release while exporting a supported mesh. Only Ilyra's runtime atlas is rebuilt; it retains eight facings, 48 walk samples, 17 release/recovery samples and fixed camera/root/lighting.

[Grip evidence](archer-grip-v0.21.1.json) records 99 source-space samples across idle, walking and attack. The largest distance between the off-hand grip and its nearest bow vertex is approximately 0.0151 units, below the baker's 0.035 rejection threshold. This check establishes attachment; it does not by itself establish good posing. [Archer review](screenshots/archer-v0.21.1.webm) shows all eight facings through walking, idle and two release/recovery actions using the runtime sprite renderer. Its ground reference and hidden UI are for inspection; it is captured at 30 fps and is not a hardware benchmark.

## Verification

Local validation: 73 unit tests and seven focused browser tests pass. Browser coverage includes all-role attacks/projectiles, expanded-world patrol/combat/persistence, idle stability, Brute windup/contact/death, Gravewarden rig selection and Aldric's mace equipment.

Production build, standalone packaging and formatting checks pass. The GitHub workflow runs the complete suite before publication; its verification timeout is now twenty minutes because the previous expanded browser suite took 12.6 minutes. Live playtest checks follow deployment.
