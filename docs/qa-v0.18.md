# v0.18 Mercenary movement

Scope: all six mercenary walks, following, turning, stopping and visibility in crowded scenery.

## Changes

- The previous companion cycles interpolated only two similar poses. Each role now has an original four-phase source sheet and a separately painted step contact, baked into 24-frame loops with three coherent variations. Stride length differs by role and advances with actual distance travelled.
- Tiny fragments from neighboring source cells could be mistaken for the head during pose registration, shrinking or shifting the entire body. The companion baker rejects isolated fragments before registration and stabilizes coverage/exposure after interpolation and resizing.
- Formation routing now checks every 0.18 seconds, retains useful routes until the goal changes materially, rotates the formation gradually, accelerates, catches up and brakes on arrival. Separate start/stop thresholds avoid tiny repeated walk restarts.
- Companion headings turn along the shortest angular arc with a bounded rate, and presentation interpolates yaw between simulation ticks. Hold, downed actors and attack recovery retain their existing behavior.
- Combat reports actual engagement after its range and line-of-attack checks. An arbitrary nearby enemy no longer freezes a mercenary behind an obstacle; pursuit orders take priority over formation.
- Renderer row offsets use each gait's frame count. Visual review caught the old fixed 16-frame offset sampling the wrong actor after the new 24-frame bake; all-role browser coverage now verifies both frame count and actor offset.
- Foreground occluders fade for visible mercenaries as well as the hero. The walking atlases use Vite-hashed URLs to prevent old cached 16-frame sheets being paired with new playback.

## Evidence and verification

[Six-role motion samples](screenshots/mercenary-gaits-v0.18.webp), [recording](screenshots/mercenary-gaits-v0.18.webm), and [following trace](mercenary-follow-v0.18.json). The controlled recording hides scenery to inspect each figure, while preserving actual world following and 30 Hz simulation with 60 Hz presentation. This is a temporal review, not a sustained hardware FPS benchmark.

63 unit checks and five focused browser checks passed locally, covering every role's following/arrival/Hold, variable atlas offsets, actual attacks and recovery, hero playback interpolation and automatic attacks. Formatting, production build and standalone packaging passed. The deployment workflow also runs the complete browser suite before publishing.

All twelve atlas checks passed: 264 actor/facing/variation sequences, maximum decoded luminance range 0.659, opaque interior alpha 255, and maximum variant seam RGB difference 2.118. Mercenary walking textures remain 1152×6912, within an 8192 texture limit. Source sheets are original generated paintings referencing this project's existing original character artwork; no Diablo game assets are included.

## Remaining visual limits

These are still four-direction sprites, with inferred intermediate anatomy and 96-pixel baked cells. Enlarged motion previews remain softer than stationary artwork, and some foot contacts/cloth occlusions need denser authored poses. Smooth routing and interpolation do not make the underlying artwork a finished eight-direction character animation set. Mercenary attack artwork retains its previous 17-frame sequences.
