# Third-party character artwork

The thirteen sprite atlases under `assets/rigged/` adapt character rigs by **Clint Bellanger**, from Flare, licensed under **Creative Commons Attribution 3.0 Unported**.

| Artwork                    | Emberfall actors             | Original source                                            |
| -------------------------- | ---------------------------- | ---------------------------------------------------------- |
| Isometric Hero and Heroine | Hero and all six mercenaries | https://opengameart.org/content/isometric-hero-and-heroine |
| Goblin                     | Fallen                       | https://opengameart.org/content/goblin                     |
| Zombie                     | Risen                        | https://opengameart.org/content/zombie-0                   |
| Minotaur                   | Ashen Brute                  | https://opengameart.org/content/minotaur                   |
| Skeleton Warrior           | Gravewarden                  | https://opengameart.org/content/skeleton-warrior           |

The Blender models and texture dependencies come from [the pinned Flare art-source revision](https://github.com/flareteam/flare-game-art-src/tree/00d4ca3a20718345d9f8d8ebad865ce52da05be9/art_src_hd/characters). The upstream [credits](https://github.com/flareteam/flare-game-art-src/blob/master/CREDITS.txt) identify these models and licenses. Justin Jacobs maintains the modern Flare art-source pipeline.

License: [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), with the full legal text at [assets/rigged/LICENSE.txt](assets/rigged/LICENSE.txt). Adapted sprite artwork remains distributed under CC BY 3.0. This notice does not change the license of unrelated game code or artwork.

Emberfall adaptations include original mantles and off-hand dagger assembly, distinct role palettes, armor and weapon selection, skeletal action resampling, supporting-toe IK correction, calibrated directional rendering, windup/release/death clips and WebP atlas packing. The human rigs use the original `shield` mesh; the separately credited CC BY-SA iron buckler and newer kite shield are excluded.

The goblin source's Paper001 texture dependencies are from [ambientCG](https://ambientcg.com/view?id=Paper001), available under [CC0](https://docs.ambientcg.com/license/).

Sources can be retrieved and the atlases rebuilt with [scripts/rigged](scripts/rigged/README.md). The downloader pins the source revision and records SHA-256 hashes of every dependency. Source models and intermediate GLBs are kept outside the game repository.
