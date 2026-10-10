# Third-party character artwork

The three sprite atlases under `assets/rigged/` are adaptations of **Isometric Hero and Heroine**, by **Clint Bellanger**, from the Flare project.

- Original work: https://opengameart.org/content/isometric-hero-and-heroine
- Blender source: https://github.com/flareteam/flare-game-art-src/blob/00d4ca3a20718345d9f8d8ebad865ce52da05be9/art_src_hd/characters/hero/hero.blend
- Flare credits and licensing: https://github.com/flareteam/flare-game-art-src/blob/master/CREDITS.txt
- License: [Creative Commons Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/), with the full legal text at [assets/rigged/LICENSE.txt](assets/rigged/LICENSE.txt).

Emberfall adaptations include an original burgundy mantle, armor and weapon assembly, material adjustments, skeletal action resampling, supporting-toe IK correction, new directional rendering, camera framing and WebP atlas packing. The adapted sprite artwork is distributed under CC BY 3.0. This notice does not change the licensing of unrelated game code or artwork.

The prototype uses the original `shield` mesh, not the separately credited CC BY-SA iron buckler. Justin Jacobs maintains the modern Flare art-source pipeline; the repository credits his newer kite shield separately, and that mesh is not used here.

The source model and texture dependencies can be retrieved and the atlases rebuilt with the scripts in [scripts/rigged](scripts/rigged/README.md). The source revision is pinned in the downloader, which records SHA-256 hashes of every retrieved dependency.
