# Rigged directional sprite prototype

The hero and Bram use real skeletal poses from Clint Bellanger's Flare character source, plus an original burgundy mantle. See [third-party attribution](../../THIRD_PARTY.md).

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
