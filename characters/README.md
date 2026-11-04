# Character runtime code

This folder contains code responsible for player/NPC character creation, loading and appearance.

- `accra-figure.js`: fallback stylized human figure API.
- `accra-people.js`: active rigged GLB character pipeline for NPCs, police and remote players.
- `accra-profile.js`: player profile, appearance and wardrobe UI.
- `legacy/`: older procedural avatar and model-loader implementations retained for reference.

The GLB model assets remain in `../People/AccraLife/` for now. Both player and NPC loaders resolve that asset directory relative to the game page. Keep those paths aligned if the asset layout changes.
