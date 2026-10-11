# Rigged directional character pipeline

The hero, all six mercenaries and all current enemy/boss archetypes use skeletal poses from Clint Bellanger's Flare character and creature sources, with Emberfall outfit and material adaptations. See [third-party attribution](../../THIRD_PARTY.md).

This baker renders original 3D poses with Three.js into transparent sprite atlases. It does not interpolate painted images. It constructs a cyclic skeletal walk from the source's eight run poses, corrects the supporting toes with two-bone IK, and samples 48 walk frames. Hero attack poses are sampled into 33 frames; Bram's release and recovery use 17 frames. Weapon meshes share the body skeleton. Camera scale, root origin and lighting remain fixed throughout each action.

Requirements: Blender 4.3 or later with compatible 4.5 file support, Python 3, the project's Node dependencies, and Playwright Chromium. The pinned source predates the repository's Blender 5.x migration.

```sh
python scripts/rigged/prepare.py /tmp/emberfall-rigged
blender -b /tmp/emberfall-rigged/hero.blend --python scripts/rigged/export.py -- /tmp/emberfall-rigged
CHROMIUM_PATH=/usr/bin/chromium node scripts/rigged/bake.mjs /tmp/emberfall-rigged
```

Use an available Chromium executable or omit `CHROMIUM_PATH` to use Playwright's installation. Downloaded source and intermediate GLB files stay outside the repository. Committed WebP atlases are the runtime assets.

The supporting toe follows a linear backward trajectory during each planted quarter-cycle. `bake-report.json` contains its sampled world positions, the model stride and the conversion to game units. These measure rig contact, not subpixel sprite contact between displayed frames. Small differences in WebP encoding or shader output can occur across browser versions.

The current game prototype uses 16 hero directions and eight Bram directions. Each pose is rendered on a fixed 256-pixel canvas, then its transparent margins are trimmed and packed into one 2048-pixel-wide atlas per weapon set. JSON frame rectangles retain the exact ground origin; cropping never changes body scale. Runtime scale is 0.02625 game units per pixel, with a 3.5588-unit full stride. The baker rejects any pose touching the render boundary. Inspect the generated report if camera scale, model geometry or framing changes; recalibrate `src/rigged-sprites.js` rather than guessing playback speed.

## Remaining mercenaries and creatures

The expanded cast uses a separate baker so the approved hero/Bram atlases remain reproducible with the original command above. Prepare all pinned dependencies:

```sh
python scripts/rigged/prepare.py /tmp/emberfall-cast --cast
blender -t 2 -b /tmp/emberfall-cast/hero.blend --python scripts/rigged/export-party.py -- /tmp/emberfall-cast male
blender -t 2 -b /tmp/emberfall-cast/heroine.blend --python scripts/rigged/export-party.py -- /tmp/emberfall-cast female
```

Export each creature with the same script, passing its name (`goblin`, `zombie`, `skeleton`, `minotaur`) as the final argument and its corresponding `.blend` file. Then bake:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/rigged/bake-cast.mjs /tmp/emberfall-cast
```

The baker's default cast includes the five mercenaries, Aldric's mace equipment set, Fallen, Risen, Brute and Gravewarden. Supply role names after the stage path to rebuild only those assets. `REVIEW_ONLY=1` generates source-pose previews without writing runtime atlases.

[cast-profiles.js](cast-profiles.js) records outfit parts, palettes, source-frame timelines, stance intervals, camera span and model-to-world scale. All actors retain eight directions; slow Risen and Gravewarden walks use 96 samples, the Brute uses 64, and other walks use 48. Release/recovery has 17 samples, and enemy windup/death has 33. Cast framing differs by profile to accommodate long staffs and large weapon arcs, but every clip for a given actor uses the same camera scale and root. JSON `unitsPerPixel` and `stride` calibrate runtime geometry and movement; elite actor scaling also scales the stride.

`cast-bake-report.json` contains directional asset dimensions, source timing, stride and sampled toe trajectories. Humanoid stance intervals use the same two-bone IK correction as the pilot. The minotaur retains its source rig's authored hoof constraints; its foot motion should be reviewed separately. All poses are checked against the render boundary before packing. These checks do not constitute a hardware performance benchmark or proof of perfect foot locking during turns.
