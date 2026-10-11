# Repository guidance

For character, creature, animation or visual work, read [the approved art direction](docs/ART_DIRECTION.md) first. The player approved the v0.20/v0.21 rig-rendered sprites as the direction for future work. Extend the coherent skeletal pipeline, preserve fixed lighting/scale/root offsets, and verify weapon attachments and action transitions in the actual game.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for verification and [THIRD_PARTY.md](THIRD_PARTY.md) for asset provenance. Downloaded source models and intermediate GLBs stay outside the repository. Do not replace the approved actors with separately generated poses or revive the legacy painted-frame interpolation pipeline.

Finish source/asset edits before browser captures and tests. Review changed animation in motion at normal game scale, including idle, turning, equipment and combat, and record relevant evidence in `docs/`. Automated tests complement visual review.

Astra review is disabled at the user’s request. Do not launch or schedule an Astra review unless the user explicitly enables it again.
