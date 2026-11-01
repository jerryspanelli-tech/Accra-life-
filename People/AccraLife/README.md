# Accra Life player characters

This folder contains generated, rigged GLB player models for Accra Life.

- `AccraLife_Male.glb` — adult male body, African skin preset, Kente-accented streetwear.
- `AccraLife_Female.glb` — adult female body, African skin preset, Kente-accented streetwear.

Models are generated from the CC0 MakeHuman character data through [Ara 3D Gen](https://github.com/olatunde85/3d-gen). The game export target is the 65-bone game rig, A-pose, low detail, with Idle/Walk/Run animations. Generated files are not considered production-ready until both GLBs pass structural checks and are tested in Babylon.js against the real Accra Life player controller.

The generator's setup-assets step downloads approximately 420 MB of source data; the game repository stores only the exported player assets, not the generator or source dataset.
